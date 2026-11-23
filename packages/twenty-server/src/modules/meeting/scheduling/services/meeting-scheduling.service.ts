import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';

import { isNonEmptyString } from '@sniptt/guards';
import { isDefined } from 'twenty-shared/utils';
import { DataSource } from 'typeorm';
import { v4 } from 'uuid';

import { getWorkspaceSchemaName } from 'src/engine/workspace-datasource/utils/get-workspace-schema-name.util';
import {
  type MeetingCalendarSlot,
  MeetingGoogleCalendarService,
  type MeetingGoogleEvent,
} from 'src/modules/meeting/scheduling/services/meeting-google-calendar.service';

export type MeetingAttendeeInput = {
  email: string;
  displayName?: string | null;
  personId?: string | null;
  workspaceMemberId?: string | null;
};

export type MeetingTargetInput = {
  objectNameSingular: string;
  recordId: string;
};

export type SaveMeetingInput = {
  workspaceId: string;
  callerWorkspaceMemberId: string;
  mode: 'SCHEDULE' | 'LOG';
  hostWorkspaceMemberId: string;
  title: string;
  startsAt: string;
  endsAt: string;
  timeZone: string;
  meetingType: string | null;
  meetingOutcome: string | null;
  locationType: string | null;
  location: string | null;
  attendeeDescription: string | null;
  internalNote: string | null;
  attendees: MeetingAttendeeInput[];
  targets: MeetingTargetInput[];
};

export type HostCalendar = {
  source: 'HOST_CALENDAR' | 'FREE_BUSY' | 'UNAVAILABLE';
  slots: MeetingCalendarSlot[];
};

const TARGET_COLUMN_BY_OBJECT: Record<string, string> = {
  person: 'targetPersonId',
  company: 'targetCompanyId',
  opportunity: 'targetOpportunityId',
  service: 'targetServiceId',
};

@Injectable()
export class MeetingSchedulingService {
  private readonly logger = new Logger(MeetingSchedulingService.name);

  constructor(
    @InjectDataSource()
    private readonly coreDataSource: DataSource,
    private readonly meetingGoogleCalendarService: MeetingGoogleCalendarService,
  ) {}

  // The host's own calendar when they connected Google, else their busy time read with the caller's account
  async getHostCalendar({
    workspaceId,
    callerWorkspaceMemberId,
    hostWorkspaceMemberId,
    timeMin,
    timeMax,
  }: {
    workspaceId: string;
    callerWorkspaceMemberId: string;
    hostWorkspaceMemberId: string;
    timeMin: string;
    timeMax: string;
  }): Promise<HostCalendar> {
    try {
      const hostAccount =
        await this.meetingGoogleCalendarService.findMemberGoogleAccount(
          workspaceId,
          hostWorkspaceMemberId,
        );

      if (isDefined(hostAccount)) {
        const slots = await this.meetingGoogleCalendarService.listEvents(
          hostAccount,
          timeMin,
          timeMax,
        );

        if (isDefined(slots)) {
          return { source: 'HOST_CALENDAR', slots };
        }
      }

      const hostEmail = await this.getMemberEmail(
        workspaceId,
        hostWorkspaceMemberId,
      );
      const callerAccount =
        await this.meetingGoogleCalendarService.findMemberGoogleAccount(
          workspaceId,
          callerWorkspaceMemberId,
        );

      if (isNonEmptyString(hostEmail) && isDefined(callerAccount)) {
        const busy = await this.meetingGoogleCalendarService.freeBusy(
          callerAccount,
          hostEmail,
          timeMin,
          timeMax,
        );

        if (isDefined(busy)) {
          return { source: 'FREE_BUSY', slots: busy };
        }
      }
    } catch (error) {
      this.logger.warn(
        `Host calendar unavailable in workspace ${workspaceId}: ${(error as Error).message}`,
      );
    }

    return { source: 'UNAVAILABLE', slots: [] };
  }

  async saveMeeting(input: SaveMeetingInput): Promise<{
    meetingId: string;
    warning: string | null;
  }> {
    let googleEvent: MeetingGoogleEvent | null = null;
    let warning: string | null = null;

    if (input.mode === 'SCHEDULE') {
      const result = await this.createGoogleEvent(input);

      googleEvent = result.googleEvent;
      warning = result.warning;
    }

    const meetingId = await this.insertMeeting(input, googleEvent);

    return { meetingId, warning };
  }

  // On the host's calendar; when the host never connected Google, on the creator's with the host invited
  private async createGoogleEvent(input: SaveMeetingInput) {
    const hostAccount =
      await this.meetingGoogleCalendarService.findMemberGoogleAccount(
        input.workspaceId,
        input.hostWorkspaceMemberId,
      );
    const isHostAccountUsable =
      isDefined(hostAccount) &&
      this.meetingGoogleCalendarService.canWriteCalendar(hostAccount);
    let account = isHostAccountUsable ? hostAccount : null;
    let warning: string | null = null;
    const attendeeEmails = [
      ...new Set(
        input.attendees
          .map(({ email }) => email.trim().toLowerCase())
          .filter(isNonEmptyString),
      ),
    ];

    if (!isDefined(account)) {
      account = await this.meetingGoogleCalendarService.findMemberGoogleAccount(
        input.workspaceId,
        input.callerWorkspaceMemberId,
      );

      if (
        !isDefined(account) ||
        !this.meetingGoogleCalendarService.canWriteCalendar(account)
      ) {
        throw new Error(
          'Connect your Google account in Settings to schedule meetings',
        );
      }

      const hostEmail = await this.getMemberEmail(
        input.workspaceId,
        input.hostWorkspaceMemberId,
      );

      if (
        isNonEmptyString(hostEmail) &&
        !attendeeEmails.includes(hostEmail.toLowerCase())
      ) {
        attendeeEmails.push(hostEmail.toLowerCase());
      }
      if (input.hostWorkspaceMemberId !== input.callerWorkspaceMemberId) {
        warning =
          "The host hasn't connected Google, so the meeting is on your calendar with the host invited";
      }
    }

    const googleEvent = await this.meetingGoogleCalendarService.createEvent(
      account,
      {
        title: input.title,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        timeZone: input.timeZone,
        attendeeEmails,
        description: input.attendeeDescription,
        location:
          input.locationType === 'VIDEO_CONFERENCE' ? null : input.location,
        addGoogleMeet: input.locationType === 'VIDEO_CONFERENCE',
      },
    );

    return { googleEvent, warning };
  }

  private async insertMeeting(
    input: SaveMeetingInput,
    googleEvent: MeetingGoogleEvent | null,
  ): Promise<string> {
    const schema = getWorkspaceSchemaName(input.workspaceId);
    const meetingId = v4();
    const creatorName = await this.getMemberName(
      input.workspaceId,
      input.callerWorkspaceMemberId,
    );
    const isScheduled = input.mode === 'SCHEDULE';
    const location =
      isScheduled && input.locationType === 'VIDEO_CONFERENCE'
        ? (googleEvent?.meetLink ?? input.location)
        : input.location;

    await this.coreDataSource.transaction(async (manager) => {
      await manager.query(
        `INSERT INTO "${schema}"."meeting" (
          "id", "title", "startsAt", "endsAt", "timezone", "hostId", "assignedToId",
          "meetingType", "meetingOutcome", "locationType", "location",
          "meetLinkPrimaryLinkUrl", "meetLinkPrimaryLinkLabel", "meetLinkSecondaryLinks",
          "attendeeDescriptionMarkdown", "internalNoteMarkdown",
          "googleEventId", "googleCalendarId", "googleICalUid",
          "source", "transcriptStatus",
          "createdBySource", "createdByWorkspaceMemberId", "createdByName", "createdByContext",
          "updatedBySource", "updatedByWorkspaceMemberId", "updatedByName", "updatedByContext"
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $6,
          $7, $8, $9, $10,
          $11, '', NULL,
          $12, $13,
          $14, $15, $16,
          $17, $18,
          'MANUAL', $19, $20, '{}'::jsonb,
          'MANUAL', $19, $20, '{}'::jsonb
        )`,
        [
          meetingId,
          input.title,
          input.startsAt,
          input.endsAt,
          input.timeZone,
          input.hostWorkspaceMemberId,
          input.meetingType,
          input.meetingOutcome ?? (isScheduled ? 'SCHEDULED' : null),
          input.locationType,
          location,
          googleEvent?.meetLink ?? null,
          input.attendeeDescription,
          input.internalNote,
          googleEvent?.eventId ?? null,
          googleEvent?.calendarId ?? null,
          googleEvent?.iCalUid ?? null,
          isScheduled ? 'SCHEDULED_IN_CRM' : 'LOGGED_MANUALLY',
          isScheduled ? 'WAITING' : 'NOT_RECORDED',
          input.callerWorkspaceMemberId,
          creatorName,
        ],
      );

      for (const [position, attendee] of input.attendees.entries()) {
        await manager.query(
          `INSERT INTO "${schema}"."meetingAttendee"
            ("meetingId", "email", "displayName", "personId", "workspaceMemberId", "responseStatus", "isOrganizer", "position")
          VALUES ($1, $2, $3, $4, $5, 'NEEDS_ACTION', $6, $7)`,
          [
            meetingId,
            attendee.email.trim().toLowerCase(),
            attendee.displayName ?? null,
            attendee.personId ?? null,
            attendee.workspaceMemberId ?? null,
            attendee.workspaceMemberId === input.hostWorkspaceMemberId,
            position,
          ],
        );
      }

      const seen = new Set<string>();

      for (const target of input.targets) {
        const column = TARGET_COLUMN_BY_OBJECT[target.objectNameSingular];
        const key = `${column}:${target.recordId}`;

        if (!isDefined(column) || seen.has(key)) {
          continue;
        }
        seen.add(key);

        await manager.query(
          `INSERT INTO "${schema}"."meetingTarget" ("meetingId", "${column}") VALUES ($1, $2)`,
          [meetingId, target.recordId],
        );
      }
    });

    return meetingId;
  }

  async getMemberEmail(workspaceId: string, workspaceMemberId: string) {
    const schema = getWorkspaceSchemaName(workspaceId);
    const [member]: { email: string | null }[] =
      await this.coreDataSource.query(
        `SELECT "userEmail" AS email FROM "${schema}"."workspaceMember" WHERE "id" = $1`,
        [workspaceMemberId],
      );

    return member?.email ?? null;
  }

  private async getMemberName(workspaceId: string, workspaceMemberId: string) {
    const schema = getWorkspaceSchemaName(workspaceId);
    const [member]: { name: string | null }[] = await this.coreDataSource.query(
      `SELECT NULLIF(btrim(concat_ws(' ', "nameFirstName", "nameLastName")), '') AS name
      FROM "${schema}"."workspaceMember" WHERE "id" = $1`,
      [workspaceMemberId],
    );

    return member?.name ?? 'Workspace member';
  }
}
