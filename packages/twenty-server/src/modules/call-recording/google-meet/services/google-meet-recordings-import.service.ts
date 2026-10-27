import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { type Auth, google } from 'googleapis';
import { isDefined } from 'twenty-shared/utils';
import { In, Repository } from 'typeorm';

import { transformRichTextValue } from 'src/engine/core-modules/record-transformer/utils/transform-rich-text.util';
import { CalendarChannelEntity } from 'src/engine/metadata-modules/calendar-channel/entities/calendar-channel.entity';
import { ConnectedAccountEntity } from 'src/engine/metadata-modules/connected-account/entities/connected-account.entity';
import { WorkspaceOrmManager } from 'src/engine/twenty-orm/workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
import { type CalendarChannelEventAssociationWorkspaceEntity } from 'src/modules/calendar/common/standard-objects/calendar-channel-event-association.workspace-entity';
import { CallRecordingStatus } from 'src/modules/call-recording/common/enums/call-recording-status.enum';
import {
  buildTranscriptFromMeetEntries,
  buildTranscriptFromTranscriptDocument,
  type CallRecordingTranscriptEntryInput,
  type GoogleMeetTranscriptEntry,
} from 'src/modules/call-recording/google-meet/utils/build-call-recording-transcript.util';
import {
  type GoogleCalendarAttachment,
  selectGoogleMeetAttachments,
} from 'src/modules/call-recording/google-meet/utils/select-google-meet-attachments.util';
import { type CallRecordingWorkspaceEntity } from 'src/modules/call-recording/standard-objects/call-recording.workspace-entity';
import { GoogleOAuth2ClientProvider } from 'src/modules/connected-account/oauth2-client-manager/drivers/google/google-oauth2-client.provider';

export const GOOGLE_MEET_RECORDINGS_REQUIRED_SCOPES = [
  'https://www.googleapis.com/auth/drive.meet.readonly',
  'https://www.googleapis.com/auth/meetings.space.readonly',
];

const EXTERNAL_RECORDING_ID_PREFIX = 'google-meet:';

type GoogleMeetEvent = {
  id: string;
  summary: string | null;
  startsAt: string | null;
  endsAt: string | null;
  meetingCode: string | null;
  attachments: GoogleCalendarAttachment[];
};

export type GoogleMeetRecordingsImportResult = {
  imported: string[];
  unmatched: string[];
  inaccessible: string[];
  skippedForMissingScopes: boolean;
};

@Injectable()
export class GoogleMeetRecordingsImportService {
  private readonly logger = new Logger(GoogleMeetRecordingsImportService.name);

  constructor(
    private readonly googleOAuth2ClientProvider: GoogleOAuth2ClientProvider,
    private readonly workspaceOrmManager: WorkspaceOrmManager,
    @InjectRepository(ConnectedAccountEntity)
    private readonly connectedAccountRepository: Repository<ConnectedAccountEntity>,
    @InjectRepository(CalendarChannelEntity)
    private readonly calendarChannelRepository: Repository<CalendarChannelEntity>,
  ) {}

  async importForConnectedAccount({
    workspaceId,
    connectedAccountId,
    lookbackDays,
  }: {
    workspaceId: string;
    connectedAccountId: string;
    lookbackDays: number;
  }): Promise<GoogleMeetRecordingsImportResult> {
    const result: GoogleMeetRecordingsImportResult = {
      imported: [],
      unmatched: [],
      inaccessible: [],
      skippedForMissingScopes: false,
    };

    const connectedAccount = await this.connectedAccountRepository.findOne({
      where: { id: connectedAccountId, workspaceId },
    });

    if (!isDefined(connectedAccount)) {
      return result;
    }

    const grantedScopes = connectedAccount.scopes ?? [];

    if (
      !GOOGLE_MEET_RECORDINGS_REQUIRED_SCOPES.every((scope) =>
        grantedScopes.includes(scope),
      )
    ) {
      result.skippedForMissingScopes = true;

      return result;
    }

    const calendarChannelIds = (
      await this.calendarChannelRepository.find({
        select: { id: true },
        where: { connectedAccountId, workspaceId },
      })
    ).map(({ id }) => id);

    if (calendarChannelIds.length === 0) {
      return result;
    }

    const auth =
      await this.googleOAuth2ClientProvider.getClient(connectedAccountId);

    const recordedEvents = await this.listEventsWithMeetAttachments({
      auth,
      lookbackDays,
    });

    await this.workspaceOrmManager.executeInWorkspaceContext(async () => {
      const associationRepository =
        this.workspaceOrmManager.getRepository<CalendarChannelEventAssociationWorkspaceEntity>(
          'calendarChannelEventAssociation',
          { shouldBypassPermissionChecks: true },
        );

      const associations = await associationRepository.find({
        select: { calendarEventId: true, eventExternalId: true },
        where: {
          calendarChannelId: In(calendarChannelIds),
          eventExternalId: In(recordedEvents.map(({ id }) => id)),
        },
      });

      const calendarEventIdByExternalId = new Map(
        associations.map((association) => [
          association.eventExternalId,
          association.calendarEventId,
        ]),
      );

      for (const recordedEvent of recordedEvents) {
        const label = `${recordedEvent.summary ?? '(no title)'} (${recordedEvent.startsAt ?? 'no start'})`;
        const calendarEventId = calendarEventIdByExternalId.get(
          recordedEvent.id,
        );

        // Matching relies on the synced event id; an event Twenty never synced has no meeting to attach to
        if (!isDefined(calendarEventId)) {
          result.unmatched.push(label);
          continue;
        }

        const wasImported = await this.upsertCallRecording({
          auth,
          calendarEventId,
          recordedEvent,
        });

        (wasImported ? result.imported : result.inaccessible).push(label);
      }
    }, buildSystemAuthContext(workspaceId));

    this.logger.log(
      `Workspace ${workspaceId}, account ${connectedAccountId}: ${result.imported.length} Meet recording(s) imported, ${result.unmatched.length} unmatched, ${result.inaccessible.length} inaccessible`,
    );

    return result;
  }

  private async listEventsWithMeetAttachments({
    auth,
    lookbackDays,
  }: {
    auth: Auth.OAuth2Client;
    lookbackDays: number;
  }): Promise<GoogleMeetEvent[]> {
    const calendar = google.calendar({ version: 'v3', auth });
    const now = new Date();
    const events: GoogleMeetEvent[] = [];
    let pageToken: string | undefined;

    do {
      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: new Date(
          now.getTime() - lookbackDays * 24 * 3600 * 1000,
        ).toISOString(),
        timeMax: now.toISOString(),
        singleEvents: true,
        maxResults: 2500,
        pageToken,
        fields:
          'nextPageToken,items(id,summary,start,end,attachments(fileId,fileUrl,title,mimeType),conferenceData(conferenceId))',
      });

      for (const event of response.data.items ?? []) {
        const attachments = event.attachments ?? [];
        const meetAttachments = selectGoogleMeetAttachments(attachments);

        if (
          !isDefined(event.id) ||
          (!isDefined(meetAttachments.recording) &&
            !isDefined(meetAttachments.geminiNotes) &&
            !isDefined(meetAttachments.transcript))
        ) {
          continue;
        }

        events.push({
          id: event.id,
          summary: event.summary ?? null,
          startsAt: event.start?.dateTime ?? event.start?.date ?? null,
          endsAt: event.end?.dateTime ?? event.end?.date ?? null,
          meetingCode: event.conferenceData?.conferenceId ?? null,
          attachments,
        });
      }

      pageToken = response.data.nextPageToken ?? undefined;
    } while (isDefined(pageToken));

    return events;
  }

  // Returns false when the meeting has no Meet file link and none of its files could be read
  private async upsertCallRecording({
    auth,
    calendarEventId,
    recordedEvent,
  }: {
    auth: Auth.OAuth2Client;
    calendarEventId: string;
    recordedEvent: GoogleMeetEvent;
  }): Promise<boolean> {
    const { recording, geminiNotes, transcript } = selectGoogleMeetAttachments(
      recordedEvent.attachments,
    );

    const geminiNotesMarkdown = isDefined(geminiNotes?.fileId)
      ? await this.exportGoogleDoc({
          auth,
          fileId: geminiNotes.fileId,
          preferredMimeType: 'text/markdown',
        })
      : undefined;

    const transcriptEntries = await this.fetchTranscript({
      auth,
      recordedEvent,
      transcriptFileId: transcript?.fileId ?? undefined,
    });

    const recordingUrl = recording?.fileUrl ?? undefined;
    const geminiNotesUrl = geminiNotes?.fileUrl ?? undefined;

    if (
      !isDefined(recordingUrl) &&
      !isDefined(geminiNotesUrl) &&
      !isDefined(geminiNotesMarkdown) &&
      !isDefined(transcriptEntries)
    ) {
      return false;
    }

    const callRecordingRepository =
      this.workspaceOrmManager.getRepository<CallRecordingWorkspaceEntity>(
        'callRecording',
        { shouldBypassPermissionChecks: true },
      );

    const externalRecordingId = `${EXTERNAL_RECORDING_ID_PREFIX}${recordedEvent.id}`;

    const callRecordingFields: Partial<CallRecordingWorkspaceEntity> = {
      title: recordedEvent.summary,
      status: CallRecordingStatus.COMPLETED,
      externalRecordingId,
      startedAt: recordedEvent.startsAt,
      endedAt: recordedEvent.endsAt,
      calendarEventId,
      ...(isDefined(recordingUrl) && {
        recordingUrl: {
          primaryLinkUrl: recordingUrl,
          primaryLinkLabel: recording?.title ?? 'Google Meet recording',
          secondaryLinks: [],
        },
      }),
      ...(isDefined(geminiNotesUrl) && {
        notesUrl: {
          primaryLinkUrl: geminiNotesUrl,
          primaryLinkLabel: geminiNotes?.title ?? 'Gemini notes',
          secondaryLinks: [],
        },
      }),
      ...(isDefined(geminiNotesMarkdown) && {
        summary: await transformRichTextValue({
          markdown: geminiNotesMarkdown,
        }),
      }),
      ...(isDefined(transcriptEntries) && {
        transcript: transcriptEntries as unknown as Record<string, unknown>,
      }),
    };

    const existingCallRecording = await callRecordingRepository.findOne({
      select: { id: true },
      where: { externalRecordingId },
    });

    if (isDefined(existingCallRecording)) {
      await callRecordingRepository.update(
        existingCallRecording.id,
        callRecordingFields,
      );
    } else {
      await callRecordingRepository.insert(callRecordingFields);
    }

    return true;
  }

  private async fetchTranscript({
    auth,
    recordedEvent,
    transcriptFileId,
  }: {
    auth: Auth.OAuth2Client;
    recordedEvent: GoogleMeetEvent;
    transcriptFileId: string | undefined;
  }): Promise<CallRecordingTranscriptEntryInput[] | undefined> {
    const meetTranscript = await this.fetchMeetApiTranscript({
      auth,
      recordedEvent,
    });

    if (isDefined(meetTranscript) && meetTranscript.length > 0) {
      return meetTranscript;
    }

    if (!isDefined(transcriptFileId)) {
      return undefined;
    }

    const documentText = await this.exportGoogleDoc({
      auth,
      fileId: transcriptFileId,
      preferredMimeType: 'text/plain',
    });

    const documentTranscript = isDefined(documentText)
      ? buildTranscriptFromTranscriptDocument(documentText)
      : [];

    return documentTranscript.length > 0 ? documentTranscript : undefined;
  }

  // The Meet API only exposes conferences the account organized, and only when transcription was on
  private async fetchMeetApiTranscript({
    auth,
    recordedEvent,
  }: {
    auth: Auth.OAuth2Client;
    recordedEvent: GoogleMeetEvent;
  }): Promise<CallRecordingTranscriptEntryInput[] | undefined> {
    if (
      !isDefined(recordedEvent.meetingCode) ||
      !isDefined(recordedEvent.startsAt)
    ) {
      return undefined;
    }

    const meet = google.meet({ version: 'v2', auth });

    try {
      const eventStart = Date.parse(recordedEvent.startsAt);
      const { data } = await meet.conferenceRecords.list({
        filter: `space.meeting_code = "${recordedEvent.meetingCode}"`,
        pageSize: 50,
      });

      // A recurring meeting reuses its code, so the conference closest to this occurrence is the one
      const conferenceRecord = (data.conferenceRecords ?? [])
        .filter(
          (record) => isDefined(record.name) && isDefined(record.startTime),
        )
        .sort(
          (first, second) =>
            Math.abs(Date.parse(first.startTime as string) - eventStart) -
            Math.abs(Date.parse(second.startTime as string) - eventStart),
        )[0];

      if (
        !isDefined(conferenceRecord?.name) ||
        Math.abs(
          Date.parse(conferenceRecord.startTime as string) - eventStart,
        ) >
          6 * 3600 * 1000
      ) {
        return undefined;
      }

      const [{ data: transcriptsData }, { data: recordingsData }] =
        await Promise.all([
          meet.conferenceRecords.transcripts.list({
            parent: conferenceRecord.name,
          }),
          meet.conferenceRecords.recordings.list({
            parent: conferenceRecord.name,
          }),
        ]);

      const meetTranscript = transcriptsData.transcripts?.find(
        (candidate) => candidate.state === 'FILE_GENERATED',
      );

      if (!isDefined(meetTranscript?.name)) {
        return undefined;
      }

      const entries: GoogleMeetTranscriptEntry[] = [];
      const speakerNameByParticipant = new Map<string, string | null>();
      let pageToken: string | undefined;

      do {
        const { data: entriesData } =
          await meet.conferenceRecords.transcripts.entries.list({
            parent: meetTranscript.name,
            pageSize: 100,
            pageToken,
          });

        for (const entry of entriesData.transcriptEntries ?? []) {
          const participantName = entry.participant ?? undefined;

          if (
            isDefined(participantName) &&
            !speakerNameByParticipant.has(participantName)
          ) {
            const { data: participant } =
              await meet.conferenceRecords.participants.get({
                name: participantName,
              });

            speakerNameByParticipant.set(
              participantName,
              participant.signedinUser?.displayName ??
                participant.anonymousUser?.displayName ??
                participant.phoneUser?.displayName ??
                null,
            );
          }

          entries.push({
            speakerName: isDefined(participantName)
              ? (speakerNameByParticipant.get(participantName) ?? null)
              : null,
            text: entry.text ?? '',
            startTime: entry.startTime ?? null,
            endTime: entry.endTime ?? null,
          });
        }

        pageToken = entriesData.nextPageToken ?? undefined;
      } while (isDefined(pageToken));

      return buildTranscriptFromMeetEntries({
        entries,
        recordingStartTime:
          recordingsData.recordings?.[0]?.startTime ??
          conferenceRecord.startTime ??
          null,
      });
    } catch (error) {
      this.logger.warn(
        `Meet API transcript unavailable for "${recordedEvent.summary}": ${(error as Error).message}`,
      );

      return undefined;
    }
  }

  private async exportGoogleDoc({
    auth,
    fileId,
    preferredMimeType,
  }: {
    auth: Auth.OAuth2Client;
    fileId: string;
    preferredMimeType: 'text/markdown' | 'text/plain';
  }): Promise<string | undefined> {
    const drive = google.drive({ version: 'v3', auth });

    for (const mimeType of [preferredMimeType, 'text/plain']) {
      try {
        const { data } = await drive.files.export(
          { fileId, mimeType },
          { responseType: 'text' },
        );
        const text = typeof data === 'string' ? data.trim() : '';

        return text === '' ? undefined : text;
      } catch (error) {
        this.logger.warn(
          `Could not export Drive file ${fileId} as ${mimeType}: ${(error as Error).message}`,
        );
      }
    }

    return undefined;
  }
}
