import {
  formatMeetTranscript,
  formatMeetTranscriptEntries,
} from 'src/modules/meeting/artifacts/utils/format-meet-transcript.util';

const DOC = `﻿Sira x Acme - 2026/11/23 11:00 GMT+02:00 - Transcript
Attendees
Ahmed Tag, Jane Doe
Transcript
00:00:00

Ahmed Tag: Thanks for joining.
Jane Doe: Happy to be here: let's start.
00:05:12

Ahmed Tag: Pricing next.
Meeting ended after 00:40:51 👋`;

describe('formatMeetTranscript', () => {
  it('turns Meet transcript docs into "Speaker (mm:ss): text" lines', () => {
    expect(formatMeetTranscript(DOC)).toBe(
      [
        'Ahmed Tag (00:00): Thanks for joining.',
        "Jane Doe (00:00): Happy to be here: let's start.",
        'Ahmed Tag (05:12): Pricing next.',
      ].join('\n'),
    );
  });

  it('counts hours into minutes', () => {
    expect(formatMeetTranscript('Transcript\n01:02:03\nA: hi')).toBe(
      'A (62:03): hi',
    );
  });
});

describe('formatMeetTranscriptEntries', () => {
  it('stamps entries relative to the start', () => {
    expect(
      formatMeetTranscriptEntries(
        [
          {
            speaker: 'Ahmed Tag',
            text: 'Hello ',
            startTime: '2026-11-23T09:00:05Z',
          },
          { speaker: null, text: 'Hi', startTime: '2026-11-23T10:02:30Z' },
          { speaker: 'Jane', text: '  ', startTime: '2026-11-23T10:03:00Z' },
        ],
        '2026-11-23T09:00:00Z',
      ),
    ).toBe(
      ['Ahmed Tag (00:05): Hello', 'Unknown speaker (62:30): Hi'].join('\n'),
    );
  });
});
