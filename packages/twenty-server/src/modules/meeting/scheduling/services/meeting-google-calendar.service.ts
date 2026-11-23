import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';

import { google, type calendar_v3 } from 'googleapis';
import { isDefined } from 'twenty-shared/utils';
import { DataSource } from 'typeorm';
import { v4 } from 'uuid';

import { getWorkspaceSchemaName } from 'src/engine/workspace-datasource/utils/get-workspace-schema-name.util';
import { GoogleOAuth2ClientProvider } from 'src/modules/connected-account/oauth2-client-manager/drivers/google/google-oauth2-client.provider';

export type MeetingGoogleAccount = {
  id: string;
  handle: string;
  scopes: string[];
};

export type MeetingCalendarSlot = {
  startsAt: string;
  endsAt: string;
  title: string | null;
};

export type MeetingGoogleEventInput = {
  title: string;
  startsAt: string;
  endsAt: string;
  timeZone: string;
  attendeeEmails: string[];
  description: string | null;
  location: string | null;
  addGoogleMeet: boolean;
};

export type MeetingGoogleEvent = {
  eventId: string;
  iCalUid: string | null;
  calendarId: string;
  meetLink: string | null;
};

const CALENDAR_WRITE_SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar',
];
const CALENDAR_READ_SCOPES = [
  ...CALENDAR_WRITE_SCOPES,
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events.readonly',
];
const FREE_BUSY_SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.freebusy',
  'https://www.googleapis.com/auth/calendar.events.freebusy',
];

const hasAnyScope = (account: MeetingGoogleAccount, scopes: string[]) =>
  scopes.some((scope) => account.scopes.includes(scope));

// The Meetings jobs use each member's connected Google account; Twenty's own calendar import stays off
@Injectable()
export class MeetingGoogleCalendarService {
  private readonly logger = new Logger(MeetingGoogleCalendarService.name);

  constructor(
    @InjectDataSource()
    private readonly coreDataSource: DataSource,
    private readonly googleOAuth2ClientProvider: GoogleOAuth2ClientProvider,
  ) {}

  async findMemberGoogleAccount(
    workspaceId: string,
    workspaceMemberId: string,
  ): Promise<MeetingGoogleAccount | null> {
    const schema = getWorkspaceSchemaName(workspaceId);
    const accounts: MeetingGoogleAccount[] = await this.coreDataSource.query(
      `SELECT account."id", account."handle", coalesce(account."scopes", '{}') AS "scopes"
      FROM "core"."connectedAccount" account
      JOIN "core"."userWorkspace" uw ON uw."id" = account."userWorkspaceId"
      JOIN "${schema}"."workspaceMember" member ON member."userId" = uw."userId"
      WHERE member."id" = $1 AND account."workspaceId" = $2
        AND account."provider" = 'google' AND account."authFailedAt" IS NULL
      ORDER BY account."createdAt"`,
      [workspaceMemberId, workspaceId],
    );

    return (
      accounts.find((account) => hasAnyScope(account, CALENDAR_WRITE_SCOPES)) ??
      accounts[0] ??
      null
    );
  }

  canWriteCalendar(account: MeetingGoogleAccount) {
    return hasAnyScope(account, CALENDAR_WRITE_SCOPES);
  }

  private async getCalendar(account: MeetingGoogleAccount) {
    const auth = await this.googleOAuth2ClientProvider.getClient(account.id);

    return google.calendar({ version: 'v3', auth });
  }

  // The host's own events with their titles; declined and "free" events do not block a slot
  async listEvents(
    account: MeetingGoogleAccount,
    timeMin: string,
    timeMax: string,
  ): Promise<MeetingCalendarSlot[] | null> {
    if (!hasAnyScope(account, CALENDAR_READ_SCOPES)) {
      return null;
    }

    const calendar = await this.getCalendar(account);
    const response = await calendar.events.list({
      calendarId: 'primary',
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 250,
      timeMin,
      timeMax,
    });

    return (response.data.items ?? [])
      .filter((event) => event.status !== 'cancelled')
      .filter((event) => event.transparency !== 'transparent')
      .filter(
        (event) =>
          !(event.attendees ?? []).some(
            (attendee) =>
              attendee.self === true && attendee.responseStatus === 'declined',
          ),
      )
      .map((event) => toSlot(event))
      .filter(isDefined);
  }

  // Someone else's busy time, read with any account that may run a free/busy query
  async freeBusy(
    account: MeetingGoogleAccount,
    email: string,
    timeMin: string,
    timeMax: string,
  ): Promise<MeetingCalendarSlot[] | null> {
    if (!hasAnyScope(account, FREE_BUSY_SCOPES)) {
      return null;
    }

    const calendar = await this.getCalendar(account);
    const response = await calendar.freebusy.query({
      requestBody: { timeMin, timeMax, items: [{ id: email }] },
    });
    const calendarBusy = response.data.calendars?.[email];

    if (!isDefined(calendarBusy) || (calendarBusy.errors ?? []).length > 0) {
      return null;
    }

    return (calendarBusy.busy ?? [])
      .filter((busy) => isDefined(busy.start) && isDefined(busy.end))
      .map((busy) => ({
        startsAt: busy.start as string,
        endsAt: busy.end as string,
        title: null,
      }));
  }

  async createEvent(
    account: MeetingGoogleAccount,
    input: MeetingGoogleEventInput,
  ): Promise<MeetingGoogleEvent> {
    const calendar = await this.getCalendar(account);
    const response = await calendar.events.insert({
      calendarId: 'primary',
      conferenceDataVersion: input.addGoogleMeet ? 1 : 0,
      sendUpdates: 'all',
      requestBody: toGoogleEvent(input),
    });

    return toMeetingGoogleEvent(response.data);
  }

  async updateEvent(
    account: MeetingGoogleAccount,
    eventId: string,
    input: MeetingGoogleEventInput,
  ): Promise<MeetingGoogleEvent> {
    const calendar = await this.getCalendar(account);
    const response = await calendar.events.patch({
      calendarId: 'primary',
      eventId,
      conferenceDataVersion: 1,
      sendUpdates: 'all',
      requestBody: toGoogleEvent(input),
    });

    return toMeetingGoogleEvent(response.data);
  }

  async cancelEvent(account: MeetingGoogleAccount, eventId: string) {
    const calendar = await this.getCalendar(account);

    await calendar.events.delete({
      calendarId: 'primary',
      eventId,
      sendUpdates: 'all',
    });
    this.logger.log(`Cancelled Google event for account ${account.id}`);
  }
}

const toSlot = (
  event: calendar_v3.Schema$Event,
): MeetingCalendarSlot | undefined => {
  const startsAt = event.start?.dateTime;
  const endsAt = event.end?.dateTime;

  // All-day events are not slots on the week grid
  if (!isDefined(startsAt) || !isDefined(endsAt)) {
    return undefined;
  }

  return { startsAt, endsAt, title: event.summary ?? null };
};

const toGoogleEvent = (
  input: MeetingGoogleEventInput,
): calendar_v3.Schema$Event => ({
  summary: input.title,
  description: input.description ?? undefined,
  location: input.location ?? undefined,
  start: { dateTime: input.startsAt, timeZone: input.timeZone },
  end: { dateTime: input.endsAt, timeZone: input.timeZone },
  attendees: input.attendeeEmails.map((email) => ({ email })),
  ...(input.addGoogleMeet
    ? {
        conferenceData: {
          createRequest: {
            requestId: v4(),
            conferenceSolutionKey: { type: 'hangoutsMeet' },
          },
        },
      }
    : {}),
});

const toMeetingGoogleEvent = (
  event: calendar_v3.Schema$Event,
): MeetingGoogleEvent => ({
  eventId: event.id as string,
  iCalUid: event.iCalUID ?? null,
  calendarId: event.organizer?.email ?? 'primary',
  meetLink:
    event.hangoutLink ??
    event.conferenceData?.entryPoints?.find(
      (entryPoint) => entryPoint.entryPointType === 'video',
    )?.uri ??
    null,
});
