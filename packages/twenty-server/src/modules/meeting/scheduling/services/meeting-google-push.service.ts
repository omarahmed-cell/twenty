import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';

import { isNonEmptyString } from '@sniptt/guards';
import { isDefined } from 'twenty-shared/utils';
import { DataSource } from 'typeorm';

import { getWorkspaceSchemaName } from 'src/engine/workspace-datasource/utils/get-workspace-schema-name.util';
import {
  MeetingGoogleCalendarService,
  type MeetingGoogleAccount,
} from 'src/modules/meeting/scheduling/services/meeting-google-calendar.service';

export type MeetingRow = {
  id: string;
  title: string | null;
  startsAt: Date | null;
  endsAt: Date | null;
  timezone: string | null;
  locationType: string | null;
  location: string | null;
  meetLink: string | null;
  attendeeDescription: string | null;
  googleEventId: string | null;
  googleCalendarId: string | null;
  hostId: string | null;
  createdByWorkspaceMemberId: string | null;
};

// Only the fields Google shows attendees go out; internal note, type, outcome and associations stay in the CRM
@Injectable()
export class MeetingGooglePushService {
  private readonly logger = new Logger(MeetingGooglePushService.name);

  constructor(
    @InjectDataSource()
    private readonly coreDataSource: DataSource,
    private readonly meetingGoogleCalendarService: MeetingGoogleCalendarService,
  ) {}

  async pushMeeting(workspaceId: string, meetingId: string) {
    const meeting = await this.findMeeting(workspaceId, meetingId);

    if (
      !isDefined(meeting) ||
      !isNonEmptyString(meeting.googleEventId) ||
      !isDefined(meeting.startsAt) ||
      !isDefined(meeting.endsAt)
    ) {
      return;
    }

    const account = await this.findOrganizerAccount(workspaceId, meeting);

    if (!isDefined(account)) {
      return;
    }

    const schema = getWorkspaceSchemaName(workspaceId);
    const attendees: { email: string }[] = await this.coreDataSource.query(
      `SELECT lower("email") AS "email" FROM "${schema}"."meetingAttendee"
      WHERE "meetingId" = $1 AND "deletedAt" IS NULL AND "email" IS NOT NULL
      ORDER BY "position"`,
      [meetingId],
    );
    const isVideoConference = meeting.locationType === 'VIDEO_CONFERENCE';

    const updated = await this.meetingGoogleCalendarService.updateEvent(
      account,
      meeting.googleEventId,
      {
        title: meeting.title ?? '',
        startsAt: meeting.startsAt.toISOString(),
        endsAt: meeting.endsAt.toISOString(),
        timeZone: meeting.timezone ?? 'UTC',
        attendeeEmails: [...new Set(attendees.map(({ email }) => email))],
        description: meeting.attendeeDescription,
        location: isVideoConference ? null : meeting.location,
        addGoogleMeet: isVideoConference && !isNonEmptyString(meeting.meetLink),
      },
    );

    if (
      isNonEmptyString(updated.meetLink) &&
      updated.meetLink !== meeting.meetLink
    ) {
      await this.coreDataSource.query(
        `UPDATE "${schema}"."meeting" SET "meetLinkPrimaryLinkUrl" = $2,
          "location" = CASE WHEN "locationType" = 'VIDEO_CONFERENCE' THEN $2 ELSE "location" END
        WHERE "id" = $1`,
        [meetingId, updated.meetLink],
      );
    }
  }

  async cancelMeeting(workspaceId: string, meetingId: string) {
    const meeting = await this.findMeeting(workspaceId, meetingId);

    if (!isDefined(meeting) || !isNonEmptyString(meeting.googleEventId)) {
      return false;
    }

    const account = await this.findOrganizerAccount(workspaceId, meeting);

    if (!isDefined(account)) {
      throw new Error(
        "The meeting's organizer has no connected Google account, so it can't be cancelled from the CRM",
      );
    }

    try {
      await this.meetingGoogleCalendarService.cancelEvent(
        account,
        meeting.googleEventId,
      );
    } catch (error) {
      const code = (error as { code?: number }).code;

      if (code !== 404 && code !== 410) {
        throw error;
      }
    }

    return true;
  }

  async findMeeting(
    workspaceId: string,
    meetingId: string,
  ): Promise<MeetingRow | undefined> {
    const schema = getWorkspaceSchemaName(workspaceId);
    const [meeting]: MeetingRow[] = await this.coreDataSource.query(
      `SELECT "id", "title", "startsAt", "endsAt", "timezone", "locationType", "location",
        "meetLinkPrimaryLinkUrl" AS "meetLink", "attendeeDescriptionMarkdown" AS "attendeeDescription",
        "googleEventId", "googleCalendarId", "hostId", "createdByWorkspaceMemberId"
      FROM "${schema}"."meeting" WHERE "id" = $1`,
      [meetingId],
    );

    return meeting;
  }

  // The event lives on the organizer's calendar: the account whose address is the calendar id, else the host's or creator's
  async findOrganizerAccount(
    workspaceId: string,
    meeting: MeetingRow,
  ): Promise<MeetingGoogleAccount | null> {
    const [byHandle]: MeetingGoogleAccount[] = isNonEmptyString(
      meeting.googleCalendarId,
    )
      ? await this.coreDataSource.query(
          `SELECT "id", "handle", coalesce("scopes", '{}') AS "scopes"
          FROM "core"."connectedAccount"
          WHERE "workspaceId" = $1 AND "provider" = 'google' AND "authFailedAt" IS NULL
            AND lower("handle") = lower($2)
          ORDER BY "createdAt" LIMIT 1`,
          [workspaceId, meeting.googleCalendarId],
        )
      : [];

    if (isDefined(byHandle)) {
      return this.meetingGoogleCalendarService.canWriteCalendar(byHandle)
        ? byHandle
        : null;
    }

    if (
      isNonEmptyString(meeting.googleCalendarId) &&
      meeting.googleCalendarId !== 'primary'
    ) {
      return null;
    }

    for (const memberId of [
      meeting.hostId,
      meeting.createdByWorkspaceMemberId,
    ]) {
      if (!isDefined(memberId)) {
        continue;
      }
      const account =
        await this.meetingGoogleCalendarService.findMemberGoogleAccount(
          workspaceId,
          memberId,
        );

      if (
        isDefined(account) &&
        this.meetingGoogleCalendarService.canWriteCalendar(account)
      ) {
        return account;
      }
    }

    this.logger.log(`No organizer account for meeting ${meeting.id}`);

    return null;
  }
}
