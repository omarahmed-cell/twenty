import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';

import { isNonEmptyString } from '@sniptt/guards';
import { type Auth, type calendar_v3, google, type meet_v2 } from 'googleapis';
import { isDefined } from 'twenty-shared/utils';
import { DataSource } from 'typeorm';

import { getWorkspaceSchemaName } from 'src/engine/workspace-datasource/utils/get-workspace-schema-name.util';
import { GoogleOAuth2ClientProvider } from 'src/modules/connected-account/oauth2-client-manager/drivers/google/google-oauth2-client.provider';
import {
  formatMeetTranscript,
  formatMeetTranscriptEntries,
} from 'src/modules/meeting/artifacts/utils/format-meet-transcript.util';
import { MeetingGooglePushService } from 'src/modules/meeting/scheduling/services/meeting-google-push.service';

const GIVE_UP_AFTER_MS = 48 * 60 * 60 * 1000;
const MAX_MEETINGS_PER_RUN = 50;
const CONFERENCE_MATCH_WINDOW_MS = 6 * 60 * 60 * 1000;
const GOOGLE_DOC_MIME_TYPE = 'application/vnd.google-apps.document';
const MEET_CODE_PATTERN = /meet\.google\.com\/([a-z]{3}-[a-z]{4}-[a-z]{3})/i;

type PendingMeeting = {
  id: string;
  startsAt: Date | null;
  endsAt: Date;
  meetLink: string | null;
  artifactsCheckedAt: Date | null;
};

export type MeetingArtifacts = {
  recordingUrl: string | null;
  recordingDriveFileId: string | null;
  geminiNotesUrl: string | null;
  geminiNotesDocId: string | null;
  transcriptDocUrl: string | null;
  transcriptDocId: string | null;
  transcript: string | null;
};

const EMPTY_ARTIFACTS: MeetingArtifacts = {
  recordingUrl: null,
  recordingDriveFileId: null,
  geminiNotesUrl: null,
  geminiNotesDocId: null,
  transcriptDocUrl: null,
  transcriptDocId: null,
  transcript: null,
};

export type MeetingArtifactsSummary = {
  checked: number;
  ready: number;
  notRecorded: number;
  notAvailable: number;
  failed: number;
};

// Checks soon after the meeting, then less often: every 15 minutes for 2 hours, hourly to 12 hours, then every 4 hours
export const getArtifactsRetryDelayMs = (msSinceEnd: number) =>
  msSinceEnd < 2 * 3_600_000
    ? 0
    : msSinceEnd < 12 * 3_600_000
      ? 3_600_000
      : 4 * 3_600_000;

// Meet also attaches the recording, transcript and Gemini notes to the organizer's calendar event
export const pickCalendarAttachmentArtifacts = (
  attachments: calendar_v3.Schema$EventAttachment[],
): MeetingArtifacts => {
  const recording = attachments.find(
    (attachment) =>
      attachment.mimeType?.startsWith('video/') === true ||
      /recording$/i.test(attachment.title ?? ''),
  );
  const notes = attachments.find((attachment) =>
    /notes by gemini/i.test(attachment.title ?? ''),
  );
  const transcript = attachments.find(
    (attachment) =>
      attachment.mimeType === GOOGLE_DOC_MIME_TYPE &&
      /transcript$/i.test(attachment.title ?? ''),
  );

  return {
    ...EMPTY_ARTIFACTS,
    recordingUrl: recording?.fileUrl ?? null,
    recordingDriveFileId: recording?.fileId ?? null,
    geminiNotesUrl: notes?.fileUrl ?? null,
    geminiNotesDocId: notes?.fileId ?? null,
    transcriptDocUrl: transcript?.fileUrl ?? null,
    transcriptDocId: transcript?.fileId ?? null,
  };
};

const mergeArtifacts = (
  primary: MeetingArtifacts,
  fallback: MeetingArtifacts,
): MeetingArtifacts =>
  Object.fromEntries(
    Object.keys(EMPTY_ARTIFACTS).map((key) => [
      key,
      primary[key as keyof MeetingArtifacts] ??
        fallback[key as keyof MeetingArtifacts],
    ]),
  ) as MeetingArtifacts;

const getErrorCode = (error: unknown) => (error as { code?: number }).code;

@Injectable()
export class MeetingArtifactsService {
  private readonly logger = new Logger(MeetingArtifactsService.name);

  constructor(
    @InjectDataSource()
    private readonly coreDataSource: DataSource,
    private readonly googleOAuth2ClientProvider: GoogleOAuth2ClientProvider,
    private readonly meetingGooglePushService: MeetingGooglePushService,
  ) {}

  async syncWorkspace(workspaceId: string): Promise<MeetingArtifactsSummary> {
    const summary: MeetingArtifactsSummary = {
      checked: 0,
      ready: 0,
      notRecorded: 0,
      notAvailable: 0,
      failed: 0,
    };
    const schema = getWorkspaceSchemaName(workspaceId);
    const pending: PendingMeeting[] = await this.coreDataSource.query(
      `SELECT "id", "startsAt", "endsAt", "meetLinkPrimaryLinkUrl" AS "meetLink", "artifactsCheckedAt"
      FROM "${schema}"."meeting"
      WHERE "deletedAt" IS NULL AND "transcriptStatus" = 'WAITING'
        AND "endsAt" < now() AND "endsAt" > now() - interval '7 days'
        AND "googleEventId" IS NOT NULL
        AND coalesce("meetLinkPrimaryLinkUrl", '') <> ''
      ORDER BY "artifactsCheckedAt" ASC NULLS FIRST, "endsAt" DESC
      LIMIT 500`,
    );
    const now = Date.now();
    const due = pending
      .filter(({ endsAt, artifactsCheckedAt }) => {
        const msSinceEnd = now - new Date(endsAt).getTime();

        return (
          !isDefined(artifactsCheckedAt) ||
          msSinceEnd > GIVE_UP_AFTER_MS ||
          now - new Date(artifactsCheckedAt).getTime() >=
            getArtifactsRetryDelayMs(msSinceEnd)
        );
      })
      .slice(0, MAX_MEETINGS_PER_RUN);

    for (const meeting of due) {
      summary.checked += 1;
      try {
        const status = await this.syncMeeting(workspaceId, meeting);

        if (status === 'READY') summary.ready += 1;
        if (status === 'NOT_RECORDED') summary.notRecorded += 1;
        if (status === 'NOT_AVAILABLE') summary.notAvailable += 1;
      } catch (error) {
        summary.failed += 1;
        // Only the error message: transcript text never reaches the logs
        this.logger.warn(
          `Meet artifacts failed for meeting ${meeting.id}: ${(error as Error).message?.slice(0, 200)}`,
        );
        await this.coreDataSource.query(
          `UPDATE "${schema}"."meeting" SET "artifactsCheckedAt" = now() WHERE "id" = $1`,
          [meeting.id],
        );
      }
    }

    return summary;
  }

  private async syncMeeting(
    workspaceId: string,
    pending: PendingMeeting,
  ): Promise<'READY' | 'NOT_RECORDED' | 'NOT_AVAILABLE' | 'WAITING'> {
    const schema = getWorkspaceSchemaName(workspaceId);
    const isPastDeadline =
      Date.now() - new Date(pending.endsAt).getTime() > GIVE_UP_AFTER_MS;
    const meeting = await this.meetingGooglePushService.findMeeting(
      workspaceId,
      pending.id,
    );
    const account = isDefined(meeting)
      ? await this.meetingGooglePushService.findOrganizerAccount(
          workspaceId,
          meeting,
        )
      : null;

    if (
      !isDefined(meeting) ||
      !isNonEmptyString(meeting.googleEventId) ||
      !isDefined(account)
    ) {
      const status = isPastDeadline ? 'NOT_AVAILABLE' : 'WAITING';

      await this.coreDataSource.query(
        `UPDATE "${schema}"."meeting" SET "transcriptStatus" = $2, "artifactsCheckedAt" = now() WHERE "id" = $1`,
        [pending.id, status],
      );

      return status;
    }

    const auth = await this.googleOAuth2ClientProvider.getClient(account.id);
    const meetArtifacts = await this.fetchMeetApiArtifacts(auth, pending);
    const calendar = google.calendar({ version: 'v3', auth });
    const event = await calendar.events.get({
      calendarId: 'primary',
      eventId: meeting.googleEventId,
    });
    const artifacts = mergeArtifacts(
      meetArtifacts,
      pickCalendarAttachmentArtifacts(event.data.attachments ?? []),
    );
    let isDocBlocked = false;
    const exportDoc = async (fileId: string | null) => {
      if (!isNonEmptyString(fileId)) {
        return null;
      }
      try {
        const exported = await google
          .drive({ version: 'v3', auth })
          .files.export(
            { fileId, mimeType: 'text/plain' },
            { responseType: 'text' },
          );

        return String(exported.data ?? '');
      } catch (error) {
        if (getErrorCode(error) !== 403 && getErrorCode(error) !== 404) {
          throw error;
        }
        isDocBlocked = true;

        return null;
      }
    };

    const transcript =
      artifacts.transcript ??
      formatMeetTranscript((await exportDoc(artifacts.transcriptDocId)) ?? '');
    const geminiNotes = (await exportDoc(artifacts.geminiNotesDocId))?.trim();
    const hasAnyArtifact =
      isNonEmptyString(artifacts.recordingUrl) ||
      isNonEmptyString(artifacts.geminiNotesUrl) ||
      isNonEmptyString(artifacts.transcriptDocUrl);
    const status = isNonEmptyString(transcript)
      ? 'READY'
      : !isPastDeadline
        ? 'WAITING'
        : isDocBlocked
          ? 'NOT_AVAILABLE'
          : hasAnyArtifact
            ? 'READY'
            : 'NOT_RECORDED';

    await this.coreDataSource.query(
      `UPDATE "${schema}"."meeting" SET
        "recordingUrlPrimaryLinkUrl" = coalesce($2, "recordingUrlPrimaryLinkUrl"),
        "recordingDriveFileId" = coalesce($3, "recordingDriveFileId"),
        "geminiNotesUrlPrimaryLinkUrl" = coalesce($4, "geminiNotesUrlPrimaryLinkUrl"),
        "transcriptDocUrlPrimaryLinkUrl" = coalesce($5, "transcriptDocUrlPrimaryLinkUrl"),
        "transcript" = coalesce($6, "transcript"),
        "aiSummaryMarkdown" = coalesce($7, "aiSummaryMarkdown"),
        "transcriptStatus" = $8,
        "artifactsCheckedAt" = now()
      WHERE "id" = $1`,
      [
        pending.id,
        artifacts.recordingUrl,
        artifacts.recordingDriveFileId,
        artifacts.geminiNotesUrl,
        artifacts.transcriptDocUrl,
        isNonEmptyString(transcript) ? transcript : null,
        isNonEmptyString(geminiNotes) ? geminiNotes : null,
        status,
      ],
    );

    return status;
  }

  // The Meet API only lists conferences the account organized; entries carry speaker names and timings
  private async fetchMeetApiArtifacts(
    auth: Auth.OAuth2Client,
    pending: PendingMeeting,
  ): Promise<MeetingArtifacts> {
    const meetingCode = pending.meetLink?.match(MEET_CODE_PATTERN)?.[1];

    if (!isDefined(meetingCode) || !isDefined(pending.startsAt)) {
      return EMPTY_ARTIFACTS;
    }

    const meet = google.meet({ version: 'v2', auth });

    try {
      const startsAt = new Date(pending.startsAt).getTime();
      const { data } = await meet.conferenceRecords.list({
        filter: `space.meeting_code = "${meetingCode.toLowerCase()}"`,
        pageSize: 50,
      });
      const conference = (data.conferenceRecords ?? [])
        .filter(
          (record) => isDefined(record.name) && isDefined(record.startTime),
        )
        .sort(
          (first, second) =>
            Math.abs(Date.parse(first.startTime as string) - startsAt) -
            Math.abs(Date.parse(second.startTime as string) - startsAt),
        )[0];

      if (
        !isDefined(conference?.name) ||
        Math.abs(Date.parse(conference.startTime as string) - startsAt) >
          CONFERENCE_MATCH_WINDOW_MS
      ) {
        return EMPTY_ARTIFACTS;
      }

      const [recordings, transcripts, smartNotes] = await Promise.all([
        meet.conferenceRecords.recordings.list({ parent: conference.name }),
        meet.conferenceRecords.transcripts.list({ parent: conference.name }),
        meet.conferenceRecords.smartNotes
          .list({ parent: conference.name })
          .catch(() => ({ data: { smartNotes: [] } })),
      ]);
      const recording = recordings.data.recordings?.find(
        (candidate) => candidate.state === 'FILE_GENERATED',
      );
      const transcriptRecord = transcripts.data.transcripts?.find(
        (candidate) => candidate.state === 'FILE_GENERATED',
      );
      const notes = (
        smartNotes.data as { smartNotes?: meet_v2.Schema$SmartNote[] }
      ).smartNotes?.find((candidate) => candidate.state === 'FILE_GENERATED');

      return {
        recordingUrl: recording?.driveDestination?.exportUri ?? null,
        recordingDriveFileId: recording?.driveDestination?.file ?? null,
        transcriptDocUrl: transcriptRecord?.docsDestination?.exportUri ?? null,
        transcriptDocId: transcriptRecord?.docsDestination?.document ?? null,
        geminiNotesUrl: notes?.docsDestination?.exportUri ?? null,
        geminiNotesDocId: notes?.docsDestination?.document ?? null,
        transcript: isDefined(transcriptRecord?.name)
          ? await this.fetchTranscriptText(
              meet,
              transcriptRecord.name,
              recording?.startTime ?? conference.startTime ?? null,
            )
          : null,
      };
    } catch (error) {
      this.logger.log(
        `Meet API artifacts unavailable for meeting ${pending.id}, using the calendar attachments: ${(error as Error).message?.slice(0, 120)}`,
      );

      return EMPTY_ARTIFACTS;
    }
  }

  private async fetchTranscriptText(
    meet: meet_v2.Meet,
    transcriptName: string,
    startTime: string | null,
  ): Promise<string | null> {
    const speakerByParticipant = new Map<string, string | null>();
    const entries: {
      speaker: string | null;
      text: string;
      startTime: string | null;
    }[] = [];
    let pageToken: string | undefined;

    do {
      const { data } = await meet.conferenceRecords.transcripts.entries.list({
        parent: transcriptName,
        pageSize: 100,
        pageToken,
      });

      for (const entry of data.transcriptEntries ?? []) {
        const participantName = entry.participant ?? null;

        if (
          isDefined(participantName) &&
          !speakerByParticipant.has(participantName)
        ) {
          const { data: participant } =
            await meet.conferenceRecords.participants.get({
              name: participantName,
            });

          speakerByParticipant.set(
            participantName,
            participant.signedinUser?.displayName ??
              participant.anonymousUser?.displayName ??
              participant.phoneUser?.displayName ??
              null,
          );
        }
        entries.push({
          speaker: isDefined(participantName)
            ? (speakerByParticipant.get(participantName) ?? null)
            : null,
          text: entry.text ?? '',
          startTime: entry.startTime ?? null,
        });
      }
      pageToken = data.nextPageToken ?? undefined;
    } while (isDefined(pageToken));

    const text = formatMeetTranscriptEntries(entries, startTime);

    return isNonEmptyString(text) ? text : null;
  }
}
