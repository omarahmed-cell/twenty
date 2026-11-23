import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';

import { isNonEmptyString } from '@sniptt/guards';
import { type calendar_v3, google } from 'googleapis';
import { isDefined } from 'twenty-shared/utils';
import { DataSource, type EntityManager } from 'typeorm';
import { v4 } from 'uuid';

import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';
import { getWorkspaceSchemaName } from 'src/engine/workspace-datasource/utils/get-workspace-schema-name.util';
import { GoogleOAuth2ClientProvider } from 'src/modules/connected-account/oauth2-client-manager/drivers/google/google-oauth2-client.provider';
import { deriveMeetingLocationType } from 'src/modules/meeting/utils/derive-meeting-location-type.util';
import {
  classifyEmailAddress,
  getRegistrableDomain,
  isLinkUrlOnDomain,
  normalizeEmailAddress,
} from 'src/modules/unified-email/utils/classify-email-address.util';
import { getDomainFromEmail } from 'src/utils/get-domain-from-email';

const SYNC_WINDOW_DAYS_BACK = 30;
const SYNC_WINDOW_DAYS_AHEAD = 90;
// Incremental sync only reports changes, so the window is re-read daily to pick up events entering it
const FULL_RESYNC_INTERVAL_MS = 24 * 60 * 60 * 1000;
const SYNC_STATE_KEY_PREFIX = 'meeting-calendar-sync:';

const CALENDAR_READ_SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events.readonly',
];

type SyncAccount = {
  id: string;
  handle: string;
  scopes: string[];
  ownerWorkspaceMemberId: string;
};

type SyncState = { syncToken: string | null; fullSyncedAt: string | null };

type WorkspaceMemberRow = { id: string; email: string; name: string | null };

type PersonMatch = { id: string; companyId: string | null; email: string };

type ExistingMeeting = { id: string; meetingOutcome: string | null };

export type MeetingCalendarSyncSummary = {
  accounts: number;
  eventsRead: number;
  meetingsCreated: number;
  meetingsUpdated: number;
  meetingsCanceled: number;
};

const RESPONSE_STATUS_BY_GOOGLE_STATUS: Record<string, string> = {
  accepted: 'ACCEPTED',
  declined: 'DECLINED',
  tentative: 'TENTATIVE',
  needsAction: 'NEEDS_ACTION',
};

const getMeetLink = (event: calendar_v3.Schema$Event) =>
  event.hangoutLink ??
  event.conferenceData?.entryPoints?.find(
    (entryPoint) => entryPoint.entryPointType === 'video',
  )?.uri ??
  null;

// Creates Meetings only for events with a known CRM contact or company; never creates contacts or companies
@Injectable()
export class MeetingCalendarSyncService {
  private readonly logger = new Logger(MeetingCalendarSyncService.name);

  constructor(
    @InjectDataSource()
    private readonly coreDataSource: DataSource,
    private readonly twentyConfigService: TwentyConfigService,
    private readonly googleOAuth2ClientProvider: GoogleOAuth2ClientProvider,
  ) {}

  async syncWorkspace(
    workspaceId: string,
  ): Promise<MeetingCalendarSyncSummary> {
    const summary: MeetingCalendarSyncSummary = {
      accounts: 0,
      eventsRead: 0,
      meetingsCreated: 0,
      meetingsUpdated: 0,
      meetingsCanceled: 0,
    };
    const members = await this.findWorkspaceMembers(workspaceId);
    const handledEventIds = new Set<string>();

    for (const account of await this.findSyncAccounts(workspaceId)) {
      summary.accounts += 1;

      try {
        await this.syncAccount({
          workspaceId,
          account,
          members,
          handledEventIds,
          summary,
        });
      } catch (error) {
        this.logger.warn(
          `Meeting calendar sync failed for account ${account.id} in workspace ${workspaceId}: ${(error as Error).message}`,
        );
      }
    }

    return summary;
  }

  private async syncAccount({
    workspaceId,
    account,
    members,
    handledEventIds,
    summary,
  }: {
    workspaceId: string;
    account: SyncAccount;
    members: WorkspaceMemberRow[];
    handledEventIds: Set<string>;
    summary: MeetingCalendarSyncSummary;
  }) {
    const auth = await this.googleOAuth2ClientProvider.getClient(account.id);
    const calendar = google.calendar({ version: 'v3', auth });
    const state = await this.getSyncState(workspaceId, account.id);
    const isFullSyncDue =
      !isNonEmptyString(state.syncToken) ||
      !isDefined(state.fullSyncedAt) ||
      Date.now() - new Date(state.fullSyncedAt).getTime() >
        FULL_RESYNC_INTERVAL_MS;

    let result: { events: calendar_v3.Schema$Event[]; nextSyncToken: string };
    let isFullSync = isFullSyncDue;

    try {
      result = await this.listChangedEvents(
        calendar,
        isFullSyncDue ? null : state.syncToken,
      );
    } catch (error) {
      if ((error as { code?: number }).code !== 410) {
        throw error;
      }
      isFullSync = true;
      result = await this.listChangedEvents(calendar, null);
    }

    const windowStart = Date.now() - SYNC_WINDOW_DAYS_BACK * 86_400_000;
    const windowEnd = Date.now() + SYNC_WINDOW_DAYS_AHEAD * 86_400_000;

    for (const event of result.events) {
      summary.eventsRead += 1;

      if (!isNonEmptyString(event.id) || handledEventIds.has(event.id)) {
        continue;
      }

      const startsAt =
        event.start?.dateTime ?? event.originalStartTime?.dateTime;

      if (
        isDefined(startsAt) &&
        (new Date(startsAt).getTime() < windowStart ||
          new Date(startsAt).getTime() > windowEnd)
      ) {
        continue;
      }

      const outcome = await this.handleEvent({
        workspaceId,
        account,
        members,
        event,
      });

      if (outcome !== 'SKIPPED') {
        handledEventIds.add(event.id);
      }
      if (outcome === 'CREATED') summary.meetingsCreated += 1;
      if (outcome === 'UPDATED') summary.meetingsUpdated += 1;
      if (outcome === 'CANCELED') summary.meetingsCanceled += 1;
    }

    await this.saveSyncState(workspaceId, account.id, {
      syncToken: result.nextSyncToken,
      fullSyncedAt: isFullSync ? new Date().toISOString() : state.fullSyncedAt,
    });
  }

  private async listChangedEvents(
    calendar: calendar_v3.Calendar,
    syncToken: string | null,
  ) {
    const events: calendar_v3.Schema$Event[] = [];
    let pageToken: string | undefined;
    let nextSyncToken: string | null | undefined;

    do {
      const response = await calendar.events.list({
        calendarId: 'primary',
        singleEvents: true,
        showDeleted: true,
        maxResults: 250,
        pageToken,
        ...(isNonEmptyString(syncToken)
          ? { syncToken }
          : {
              timeMin: new Date(
                Date.now() - SYNC_WINDOW_DAYS_BACK * 86_400_000,
              ).toISOString(),
              timeMax: new Date(
                Date.now() + SYNC_WINDOW_DAYS_AHEAD * 86_400_000,
              ).toISOString(),
            }),
      });

      events.push(...(response.data.items ?? []));
      pageToken = response.data.nextPageToken ?? undefined;
      nextSyncToken = response.data.nextSyncToken;
    } while (isDefined(pageToken));

    return { events, nextSyncToken: nextSyncToken ?? '' };
  }

  async handleEvent({
    workspaceId,
    account,
    members,
    event,
  }: {
    workspaceId: string;
    account: SyncAccount;
    members: WorkspaceMemberRow[];
    event: calendar_v3.Schema$Event;
  }): Promise<'CREATED' | 'UPDATED' | 'UNCHANGED' | 'CANCELED' | 'SKIPPED'> {
    const schema = getWorkspaceSchemaName(workspaceId);
    const existing = await this.findExistingMeeting(schema, event);

    if (event.status === 'cancelled') {
      if (!isDefined(existing) || existing.meetingOutcome === 'CANCELED') {
        return 'SKIPPED';
      }
      await this.coreDataSource.query(
        `UPDATE "${schema}"."meeting" SET "meetingOutcome" = 'CANCELED', "updatedAt" = now() WHERE "id" = $1`,
        [existing.id],
      );

      return 'CANCELED';
    }

    const startsAt = event.start?.dateTime;
    const endsAt = event.end?.dateTime;

    if (!isDefined(startsAt) || !isDefined(endsAt)) {
      return 'SKIPPED';
    }

    if (isDefined(existing)) {
      const isChanged = await this.updateMeetingFromEvent(
        workspaceId,
        existing.id,
        event,
        members,
      );

      return isChanged ? 'UPDATED' : 'UNCHANGED';
    }

    if (!this.isCandidateEvent(event)) {
      return 'SKIPPED';
    }

    const internalDomains = this.twentyConfigService.get(
      'UNIFIED_EMAIL_INTERNAL_DOMAINS',
    );
    const personalDomains = this.twentyConfigService.get(
      'UNIFIED_EMAIL_PERSONAL_DOMAINS',
    );
    const attendeeEmails = this.getAttendees(event).map(({ email }) => email);
    const externalEmails = attendeeEmails.filter(
      (email) =>
        !members.some((member) => member.email === email) &&
        ['BUSINESS', 'PERSONAL'].includes(
          classifyEmailAddress({
            address: email,
            internalDomains,
            personalDomains,
          }),
        ),
    );

    if (externalEmails.length === 0) {
      return 'SKIPPED';
    }

    const people = await this.findPeopleByEmails(workspaceId, externalEmails);
    const businessDomains = [
      ...new Set(
        externalEmails
          .filter(
            (email) =>
              classifyEmailAddress({
                address: email,
                internalDomains,
                personalDomains,
              }) === 'BUSINESS',
          )
          .map((email) => getRegistrableDomain(getDomainFromEmail(email) ?? ''))
          .filter(isDefined),
      ),
    ];
    const domainCompanyIds = await this.findCompanyIdsByDomains(
      workspaceId,
      businessDomains,
    );

    if (people.length === 0 && domainCompanyIds.length === 0) {
      return 'SKIPPED';
    }

    const companyIds = [
      ...new Set([
        ...people.map(({ companyId }) => companyId).filter(isDefined),
        ...domainCompanyIds,
      ]),
    ];
    const openDealIds = await this.findOpenDealIds(workspaceId, companyIds);
    const organizerEmail = normalizeEmailAddress(event.organizer?.email ?? '');
    const hostId =
      members.find((member) => member.email === organizerEmail)?.id ??
      account.ownerWorkspaceMemberId;

    await this.coreDataSource.transaction(async (manager) => {
      const meetingId = v4();

      await this.insertMeeting(manager, schema, {
        meetingId,
        event,
        hostId,
        hostName: members.find((member) => member.id === hostId)?.name ?? null,
      });
      await this.replaceAttendees(
        manager,
        schema,
        meetingId,
        event,
        members,
        people,
      );

      const targets = [
        ...people.map(({ id }) => ['targetPersonId', id]),
        ...companyIds.map((id) => ['targetCompanyId', id]),
        ...openDealIds.map((id) => ['targetOpportunityId', id]),
      ];

      for (const [column, recordId] of targets) {
        await manager.query(
          `INSERT INTO "${schema}"."meetingTarget" ("meetingId", "${column}") VALUES ($1, $2)`,
          [meetingId, recordId],
        );
      }
    });

    return 'CREATED';
  }

  // Meetings copied from Twenty's calendar events carry only the iCal UID, so they match on it and the start time
  private async findExistingMeeting(
    schema: string,
    event: calendar_v3.Schema$Event,
  ): Promise<ExistingMeeting | undefined> {
    const [byEventId]: ExistingMeeting[] = await this.coreDataSource.query(
      `SELECT "id", "meetingOutcome" FROM "${schema}"."meeting"
      WHERE "googleEventId" = $1 AND "deletedAt" IS NULL LIMIT 1`,
      [event.id],
    );
    const startsAt =
      event.start?.dateTime ?? event.originalStartTime?.dateTime ?? null;

    if (
      isDefined(byEventId) ||
      !isNonEmptyString(event.iCalUID) ||
      !isDefined(startsAt)
    ) {
      return byEventId;
    }

    const [byICalUid]: ExistingMeeting[] = await this.coreDataSource.query(
      `SELECT "id", "meetingOutcome" FROM "${schema}"."meeting"
      WHERE "googleICalUid" = $1 AND "googleEventId" IS NULL AND "startsAt" = $2
        AND "deletedAt" IS NULL LIMIT 1`,
      [event.iCalUID, startsAt],
    );

    return byICalUid;
  }

  // Internal-only, personal (private, focus time, out of office) and declined events are not meetings
  private isCandidateEvent(event: calendar_v3.Schema$Event) {
    if (isNonEmptyString(event.eventType) && event.eventType !== 'default') {
      return false;
    }
    if (event.visibility === 'private' || event.visibility === 'confidential') {
      return false;
    }

    return !(event.attendees ?? []).some(
      (attendee) =>
        attendee.self === true && attendee.responseStatus === 'declined',
    );
  }

  private getAttendees(event: calendar_v3.Schema$Event) {
    const attendees = (event.attendees ?? [])
      .filter((attendee) => attendee.resource !== true)
      .filter((attendee) => isNonEmptyString(attendee.email))
      .map((attendee) => ({
        email: normalizeEmailAddress(attendee.email as string),
        displayName: attendee.displayName ?? null,
        responseStatus:
          RESPONSE_STATUS_BY_GOOGLE_STATUS[attendee.responseStatus ?? ''] ??
          'NEEDS_ACTION',
        isOrganizer: attendee.organizer === true,
      }));
    const organizerEmail = normalizeEmailAddress(event.organizer?.email ?? '');

    if (
      isNonEmptyString(organizerEmail) &&
      !organizerEmail.endsWith('calendar.google.com') &&
      !attendees.some(({ email }) => email === organizerEmail)
    ) {
      attendees.unshift({
        email: organizerEmail,
        displayName: event.organizer?.displayName ?? null,
        responseStatus: 'ACCEPTED',
        isOrganizer: true,
      });
    }

    return attendees.filter(
      (attendee, index) =>
        attendees.findIndex(({ email }) => email === attendee.email) === index,
    );
  }

  private getEventFields(event: calendar_v3.Schema$Event) {
    const meetLink = getMeetLink(event);
    const location = event.location ?? null;

    return {
      title: event.summary ?? '',
      startsAt: event.start?.dateTime as string,
      endsAt: event.end?.dateTime as string,
      timezone: event.start?.timeZone ?? null,
      locationType: deriveMeetingLocationType({
        conferenceLinkUrl: meetLink,
        location,
      }),
      location: location ?? meetLink,
      meetLink,
      attendeeDescription: event.description ?? null,
    };
  }

  private async insertMeeting(
    manager: EntityManager,
    schema: string,
    {
      meetingId,
      event,
      hostId,
      hostName,
    }: {
      meetingId: string;
      event: calendar_v3.Schema$Event;
      hostId: string;
      hostName: string | null;
    },
  ) {
    const fields = this.getEventFields(event);

    await manager.query(
      `INSERT INTO "${schema}"."meeting" (
        "id", "title", "startsAt", "endsAt", "timezone", "hostId", "assignedToId",
        "meetingOutcome", "locationType", "location",
        "meetLinkPrimaryLinkUrl", "meetLinkPrimaryLinkLabel",
        "attendeeDescriptionMarkdown",
        "googleEventId", "googleCalendarId", "googleICalUid",
        "source", "transcriptStatus",
        "createdBySource", "createdByWorkspaceMemberId", "createdByName", "createdByContext",
        "updatedBySource", "updatedByWorkspaceMemberId", "updatedByName", "updatedByContext"
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $6,
        'SCHEDULED', $7, $8,
        $9, '',
        $10,
        $11, $12, $13,
        'CALENDAR_SYNC', 'WAITING',
        'CALENDAR', $6, $14, '{}'::jsonb,
        'CALENDAR', $6, $14, '{}'::jsonb
      )`,
      [
        meetingId,
        fields.title,
        fields.startsAt,
        fields.endsAt,
        fields.timezone,
        hostId,
        fields.locationType,
        fields.location,
        fields.meetLink,
        fields.attendeeDescription,
        event.id,
        event.organizer?.email ?? 'primary',
        event.iCalUID ?? null,
        hostName ?? 'Calendar sync',
      ],
    );
  }

  // Google owns title, times, location and description; type, outcome, note and associations stay as edited in the CRM
  private async updateMeetingFromEvent(
    workspaceId: string,
    meetingId: string,
    event: calendar_v3.Schema$Event,
    members: WorkspaceMemberRow[],
  ) {
    const schema = getWorkspaceSchemaName(workspaceId);
    const fields = this.getEventFields(event);
    const people = await this.findPeopleByEmails(
      workspaceId,
      this.getAttendees(event).map(({ email }) => email),
    );
    const [current]: {
      title: string | null;
      startsAt: Date | null;
      endsAt: Date | null;
      location: string | null;
      meetLink: string | null;
      attendeeDescription: string | null;
      googleEventId: string | null;
    }[] = await this.coreDataSource.query(
      `SELECT "title", "startsAt", "endsAt", "location", "meetLinkPrimaryLinkUrl" AS "meetLink",
        "attendeeDescriptionMarkdown" AS "attendeeDescription", "googleEventId"
      FROM "${schema}"."meeting" WHERE "id" = $1`,
      [meetingId],
    );
    const isChanged =
      !isDefined(current) ||
      current.title !== fields.title ||
      current.startsAt?.getTime() !== new Date(fields.startsAt).getTime() ||
      current.endsAt?.getTime() !== new Date(fields.endsAt).getTime() ||
      (current.location ?? null) !== fields.location ||
      (current.meetLink ?? null) !== fields.meetLink ||
      (current.attendeeDescription ?? null) !== fields.attendeeDescription ||
      current.googleEventId !== event.id;

    await this.coreDataSource.transaction(async (manager) => {
      if (isChanged) {
        await manager.query(
          `UPDATE "${schema}"."meeting" SET
            "title" = $2, "startsAt" = $3, "endsAt" = $4,
            "timezone" = coalesce($5, "timezone"),
            "location" = $6, "meetLinkPrimaryLinkUrl" = $7,
            "locationType" = coalesce("locationType", $8),
            "attendeeDescriptionMarkdown" = $9,
            "googleEventId" = $10, "googleICalUid" = coalesce("googleICalUid", $11),
            "updatedAt" = now()
          WHERE "id" = $1`,
          [
            meetingId,
            fields.title,
            fields.startsAt,
            fields.endsAt,
            fields.timezone,
            fields.location,
            fields.meetLink,
            fields.locationType,
            fields.attendeeDescription,
            event.id,
            event.iCalUID ?? null,
          ],
        );
      }
      await this.replaceAttendees(
        manager,
        schema,
        meetingId,
        event,
        members,
        people,
      );
    });

    return isChanged;
  }

  private async replaceAttendees(
    manager: EntityManager,
    schema: string,
    meetingId: string,
    event: calendar_v3.Schema$Event,
    members: WorkspaceMemberRow[],
    people: PersonMatch[],
  ) {
    const attendees = this.getAttendees(event);
    const existing: {
      id: string;
      email: string;
      responseStatus: string;
      isOrganizer: boolean;
    }[] = await manager.query(
      `SELECT "id", lower("email") AS "email", "responseStatus", "isOrganizer"
      FROM "${schema}"."meetingAttendee" WHERE "meetingId" = $1 AND "deletedAt" IS NULL`,
      [meetingId],
    );
    const removedIds = existing
      .filter(
        ({ email }) => !attendees.some((attendee) => attendee.email === email),
      )
      .map(({ id }) => id);

    if (removedIds.length > 0) {
      await manager.query(
        `DELETE FROM "${schema}"."meetingAttendee" WHERE "id" = ANY($1::uuid[])`,
        [removedIds],
      );
    }

    for (const [position, attendee] of attendees.entries()) {
      const row = existing.find(({ email }) => email === attendee.email);

      if (isDefined(row)) {
        if (
          row.responseStatus !== attendee.responseStatus ||
          row.isOrganizer !== attendee.isOrganizer
        ) {
          await manager.query(
            `UPDATE "${schema}"."meetingAttendee"
            SET "responseStatus" = $2, "isOrganizer" = $3, "updatedAt" = now()
            WHERE "id" = $1`,
            [row.id, attendee.responseStatus, attendee.isOrganizer],
          );
        }
        continue;
      }

      await manager.query(
        `INSERT INTO "${schema}"."meetingAttendee"
          ("meetingId", "email", "displayName", "personId", "workspaceMemberId", "responseStatus", "isOrganizer", "position")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          meetingId,
          attendee.email,
          attendee.displayName,
          people.find(({ email }) => email === attendee.email)?.id ?? null,
          members.find(({ email }) => email === attendee.email)?.id ?? null,
          attendee.responseStatus,
          attendee.isOrganizer,
          position,
        ],
      );
    }
  }

  private async findSyncAccounts(workspaceId: string): Promise<SyncAccount[]> {
    const schema = getWorkspaceSchemaName(workspaceId);
    const accounts: SyncAccount[] = await this.coreDataSource.query(
      `SELECT DISTINCT ON (account."id") account."id", account."handle",
        coalesce(account."scopes", '{}') AS "scopes", member."id" AS "ownerWorkspaceMemberId"
      FROM "core"."connectedAccount" account
      JOIN "core"."userWorkspace" uw ON uw."id" = account."userWorkspaceId"
      JOIN "${schema}"."workspaceMember" member ON member."userId" = uw."userId" AND member."deletedAt" IS NULL
      WHERE account."workspaceId" = $1 AND account."provider" = 'google'
        AND account."authFailedAt" IS NULL`,
      [workspaceId],
    );

    return accounts.filter(({ scopes }) =>
      CALENDAR_READ_SCOPES.some((scope) => scopes.includes(scope)),
    );
  }

  private async findWorkspaceMembers(
    workspaceId: string,
  ): Promise<WorkspaceMemberRow[]> {
    const schema = getWorkspaceSchemaName(workspaceId);

    return this.coreDataSource.query(
      `SELECT "id", lower("userEmail") AS "email",
        NULLIF(btrim(concat_ws(' ', "nameFirstName", "nameLastName")), '') AS "name"
      FROM "${schema}"."workspaceMember" WHERE "deletedAt" IS NULL`,
    );
  }

  private async findPeopleByEmails(
    workspaceId: string,
    emails: string[],
  ): Promise<PersonMatch[]> {
    if (emails.length === 0) {
      return [];
    }
    const schema = getWorkspaceSchemaName(workspaceId);

    return this.coreDataSource.query(
      `SELECT DISTINCT ON (matched."email") matched."id", matched."companyId", matched."email"
      FROM (
        SELECT person."id", person."companyId", person."createdAt", lower(person."emailsPrimaryEmail") AS "email"
        FROM "${schema}"."person" person
        WHERE person."deletedAt" IS NULL AND lower(person."emailsPrimaryEmail") = ANY($1::text[])
        UNION ALL
        SELECT person."id", person."companyId", person."createdAt", lower(additional.email) AS "email"
        FROM "${schema}"."person" person,
          jsonb_array_elements_text(
            CASE WHEN jsonb_typeof(person."emailsAdditionalEmails") = 'array'
              THEN person."emailsAdditionalEmails" ELSE '[]'::jsonb END
          ) AS additional(email)
        WHERE person."deletedAt" IS NULL AND lower(additional.email) = ANY($1::text[])
      ) matched
      ORDER BY matched."email", matched."createdAt"`,
      [emails],
    );
  }

  private async findCompanyIdsByDomains(
    workspaceId: string,
    domains: string[],
  ): Promise<string[]> {
    const schema = getWorkspaceSchemaName(workspaceId);
    const companyIds: string[] = [];

    for (const domain of domains) {
      const candidates: {
        id: string;
        primaryLinkUrl: string | null;
        secondaryLinks: { url?: string }[] | null;
      }[] = await this.coreDataSource.query(
        `SELECT "id", "domainNamePrimaryLinkUrl" AS "primaryLinkUrl", "domainNameSecondaryLinks" AS "secondaryLinks"
        FROM "${schema}"."company"
        WHERE "deletedAt" IS NULL
          AND ("domainNamePrimaryLinkUrl" ILIKE $1 OR "domainNameSecondaryLinks"::text ILIKE $1)
        ORDER BY "createdAt"`,
        [`%${domain}%`],
      );
      const match = candidates.find(
        (candidate) =>
          (isDefined(candidate.primaryLinkUrl) &&
            isLinkUrlOnDomain(candidate.primaryLinkUrl, domain)) ||
          (Array.isArray(candidate.secondaryLinks) &&
            candidate.secondaryLinks.some(
              (link) =>
                isDefined(link?.url) && isLinkUrlOnDomain(link.url, domain),
            )),
      );

      if (isDefined(match)) {
        companyIds.push(match.id);
      }
    }

    return companyIds;
  }

  private async findOpenDealIds(
    workspaceId: string,
    companyIds: string[],
  ): Promise<string[]> {
    if (companyIds.length === 0) {
      return [];
    }
    const schema = getWorkspaceSchemaName(workspaceId);
    const deals: { id: string }[] = await this.coreDataSource.query(
      `SELECT "id" FROM "${schema}"."opportunity"
      WHERE "deletedAt" IS NULL AND "companyId" = ANY($1::uuid[]) AND coalesce("isClosed", false) = false`,
      [companyIds],
    );

    return deals.map(({ id }) => id);
  }

  private async getSyncState(
    workspaceId: string,
    connectedAccountId: string,
  ): Promise<SyncState> {
    const [row]: { value: SyncState | null }[] =
      await this.coreDataSource.query(
        `SELECT "value" FROM "core"."keyValuePair"
      WHERE "key" = $1 AND "workspaceId" = $2 AND "userId" IS NULL AND "applicationId" IS NULL`,
        [`${SYNC_STATE_KEY_PREFIX}${connectedAccountId}`, workspaceId],
      );

    return row?.value ?? { syncToken: null, fullSyncedAt: null };
  }

  private async saveSyncState(
    workspaceId: string,
    connectedAccountId: string,
    state: SyncState,
  ) {
    await this.coreDataSource.query(
      `INSERT INTO "core"."keyValuePair" ("key", "workspaceId", "value", "type")
      VALUES ($1, $2, $3::jsonb, 'USER_VARIABLE')
      ON CONFLICT ("key", "workspaceId") WHERE "userId" IS NULL AND "applicationId" IS NULL
      DO UPDATE SET "value" = EXCLUDED."value", "updatedAt" = now()`,
      [
        `${SYNC_STATE_KEY_PREFIX}${connectedAccountId}`,
        workspaceId,
        JSON.stringify(state),
      ],
    );
  }
}
