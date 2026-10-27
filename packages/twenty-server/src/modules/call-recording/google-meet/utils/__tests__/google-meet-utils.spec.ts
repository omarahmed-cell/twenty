import { parseCallRecordingTranscriptEntries } from 'twenty-shared/utils';

import {
  buildTranscriptFromMeetEntries,
  buildTranscriptFromTranscriptDocument,
} from 'src/modules/call-recording/google-meet/utils/build-call-recording-transcript.util';
import { selectGoogleMeetAttachments } from 'src/modules/call-recording/google-meet/utils/select-google-meet-attachments.util';

describe('selectGoogleMeetAttachments', () => {
  it('should pick the recording, the Gemini notes and the transcript', () => {
    const attachments = [
      {
        fileId: 'video-file',
        title: 'Twenty meeting test - 2026/10/26 23:19 EEST - Recording',
        mimeType: 'video/mp4',
      },
      {
        fileId: 'notes-file',
        title: 'Notes by Gemini',
        mimeType: 'application/vnd.google-apps.document',
      },
      {
        fileId: 'transcript-file',
        title: 'Twenty meeting test - 2026/10/26 23:19 EEST - Transcript',
        mimeType: 'application/vnd.google-apps.document',
      },
    ];

    const selected = selectGoogleMeetAttachments(attachments);

    expect(selected.recording?.fileId).toBe('video-file');
    expect(selected.geminiNotes?.fileId).toBe('notes-file');
    expect(selected.transcript?.fileId).toBe('transcript-file');
  });

  it('should ignore unrelated attachments', () => {
    expect(
      selectGoogleMeetAttachments([
        {
          fileId: 'deck',
          title: 'Agenda',
          mimeType: 'application/vnd.google-apps.presentation',
        },
      ]),
    ).toEqual({
      recording: undefined,
      geminiNotes: undefined,
      transcript: undefined,
    });
  });
});

describe('buildTranscriptFromMeetEntries', () => {
  it('should time each speaker turn from the recording start and parse in the transcript widget', () => {
    const transcript = buildTranscriptFromMeetEntries({
      recordingStartTime: '2026-10-26T20:19:00Z',
      entries: [
        {
          speakerName: 'Omar Ahmed',
          text: 'Hello everyone',
          startTime: '2026-10-26T20:19:05Z',
          endTime: '2026-10-26T20:19:07.5Z',
        },
        {
          speakerName: 'Menna',
          text: '  ',
          startTime: null,
          endTime: null,
        },
      ],
    });

    expect(transcript).toEqual([
      {
        participant: { name: 'Omar Ahmed' },
        words: [
          {
            text: 'Hello everyone',
            start_timestamp: { relative: 5 },
            end_timestamp: { relative: 7.5 },
          },
        ],
      },
    ]);
    expect(parseCallRecordingTranscriptEntries(transcript)).toEqual([
      expect.objectContaining({
        speakerName: 'Omar Ahmed',
        startSeconds: 5,
        text: 'Hello everyone',
      }),
    ]);
  });
});

describe('buildTranscriptFromTranscriptDocument', () => {
  it('should read speaker turns under their timestamp markers', () => {
    expect(
      buildTranscriptFromTranscriptDocument(
        [
          'Twenty meeting test - Transcript',
          '00:00:00',
          'Omar Ahmed: Hello everyone',
          'Menna: Hi Omar',
          '00:01:30',
          'Omar Ahmed: Let us review the pipeline',
        ].join('\n'),
      ),
    ).toEqual([
      {
        participant: { name: 'Omar Ahmed' },
        words: [
          {
            text: 'Hello everyone',
            start_timestamp: { relative: 0 },
            end_timestamp: null,
          },
        ],
      },
      {
        participant: { name: 'Menna' },
        words: [
          {
            text: 'Hi Omar',
            start_timestamp: { relative: 0 },
            end_timestamp: null,
          },
        ],
      },
      {
        participant: { name: 'Omar Ahmed' },
        words: [
          {
            text: 'Let us review the pipeline',
            start_timestamp: { relative: 90 },
            end_timestamp: null,
          },
        ],
      },
    ]);
  });
});
