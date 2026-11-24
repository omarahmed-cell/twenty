const TIMESTAMP_LINE = /^(\d{1,2}):(\d{2}):(\d{2})$/;
const SPEAKER_LINE = /^([^:\n]{1,80}?):\s+(.+)$/;
const HEADER_LINES = new Set(['transcript', 'attendees']);

const toMinutesSeconds = (hours: number, minutes: number, seconds: number) =>
  `${String(hours * 60 + minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

// Meet's transcript doc prints a timestamp line every few minutes and "Speaker: text" lines in between
export const formatMeetTranscript = (documentText: string): string => {
  const lines = documentText.replace(/\r/g, '').split('\n');
  const transcriptStart = lines.findIndex(
    (line, index) =>
      line.trim().toLowerCase() === 'transcript' &&
      lines.slice(index + 1).some((next) => TIMESTAMP_LINE.test(next.trim())),
  );
  let time = '00:00';
  const output: string[] = [];

  for (const rawLine of lines.slice(transcriptStart + 1)) {
    const line = rawLine.trim();

    if (line === '' || HEADER_LINES.has(line.toLowerCase())) {
      continue;
    }

    const timestamp = line.match(TIMESTAMP_LINE);

    if (timestamp !== null) {
      time = toMinutesSeconds(
        Number(timestamp[1]),
        Number(timestamp[2]),
        Number(timestamp[3]),
      );
      continue;
    }

    if (/^meeting ended after/i.test(line)) {
      continue;
    }

    const speaker = line.match(SPEAKER_LINE);

    output.push(
      speaker === null ? line : `${speaker[1]} (${time}): ${speaker[2]}`,
    );
  }

  return output.join('\n');
};

// Meet API entries carry absolute times; lines are stamped relative to the recording or conference start
export const formatMeetTranscriptEntries = (
  entries: { speaker: string | null; text: string; startTime: string | null }[],
  startTime: string | null,
): string => {
  const origin = startTime === null ? null : Date.parse(startTime);

  return entries
    .filter((entry) => entry.text.trim() !== '')
    .map((entry) => {
      const offsetSeconds =
        origin === null || entry.startTime === null
          ? 0
          : Math.max(
              0,
              Math.floor((Date.parse(entry.startTime) - origin) / 1000),
            );
      const time = toMinutesSeconds(
        0,
        Math.floor(offsetSeconds / 60),
        offsetSeconds % 60,
      );

      return `${entry.speaker ?? 'Unknown speaker'} (${time}): ${entry.text.trim()}`;
    })
    .join('\n');
};
