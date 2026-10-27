import { isDefined } from 'twenty-shared/utils';

// Twenty's transcript format: one entry per speaker turn, words timed in seconds from the recording start
export type CallRecordingTranscriptEntryInput = {
  participant: { name: string | null };
  words: {
    text: string;
    start_timestamp: { relative: number } | null;
    end_timestamp: { relative: number } | null;
  }[];
};

export type GoogleMeetTranscriptEntry = {
  speakerName: string | null;
  text: string;
  startTime: string | null;
  endTime: string | null;
};

const secondsSince = (
  time: string | null,
  originTime: string | null,
): { relative: number } | null => {
  if (!isDefined(time) || !isDefined(originTime)) {
    return null;
  }

  const seconds = (Date.parse(time) - Date.parse(originTime)) / 1000;

  return Number.isFinite(seconds) ? { relative: Math.max(seconds, 0) } : null;
};

export const buildTranscriptFromMeetEntries = ({
  entries,
  recordingStartTime,
}: {
  entries: GoogleMeetTranscriptEntry[];
  recordingStartTime: string | null;
}): CallRecordingTranscriptEntryInput[] =>
  entries
    .filter((entry) => entry.text.trim() !== '')
    .map((entry) => ({
      participant: { name: entry.speakerName },
      words: [
        {
          text: entry.text.trim(),
          start_timestamp: secondsSince(entry.startTime, recordingStartTime),
          end_timestamp: secondsSince(entry.endTime, recordingStartTime),
        },
      ],
    }));

const TIMESTAMP_LINE_PATTERN = /^(\d{1,2}):(\d{2}):(\d{2})$/;
const SPEAKER_LINE_PATTERN = /^([^:]{1,80}):\s+(.+)$/;

// A Meet transcript document alternates "HH:MM:SS" marker lines with "Speaker: text" lines
export const buildTranscriptFromTranscriptDocument = (
  documentText: string,
): CallRecordingTranscriptEntryInput[] => {
  const entries: CallRecordingTranscriptEntryInput[] = [];
  let currentSeconds: number | null = null;

  for (const rawLine of documentText.split(/\r?\n/)) {
    const line = rawLine.trim();
    const timestampMatch = line.match(TIMESTAMP_LINE_PATTERN);

    if (isDefined(timestampMatch)) {
      const [, hours, minutes, seconds] = timestampMatch;

      currentSeconds =
        Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds);
      continue;
    }

    const speakerMatch = line.match(SPEAKER_LINE_PATTERN);

    if (!isDefined(speakerMatch)) {
      continue;
    }

    const [, speakerName, text] = speakerMatch;

    entries.push({
      participant: { name: speakerName.trim() },
      words: [
        {
          text: text.trim(),
          start_timestamp: isDefined(currentSeconds)
            ? { relative: currentSeconds }
            : null,
          end_timestamp: null,
        },
      ],
    });
  }

  return entries;
};
