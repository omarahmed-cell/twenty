import { isDefined } from 'twenty-shared/utils';

export type ActivityDateCandidate = {
  activityType: string;
  date: string | Date | null;
  countsOnlyOncePast?: boolean;
};

// Meetings count only once they have started, so a future meeting never becomes the last activity
export const pickLatestActivityDate = ({
  candidates,
  now,
}: {
  candidates: ActivityDateCandidate[];
  now: Date;
}): string | null => {
  const timestamps = candidates
    .filter(({ date }) => isDefined(date))
    .map(({ date, countsOnlyOncePast }) => ({
      timestamp: new Date(date as string | Date).getTime(),
      countsOnlyOncePast,
    }))
    .filter(
      ({ timestamp, countsOnlyOncePast }) =>
        !Number.isNaN(timestamp) &&
        (countsOnlyOncePast !== true || timestamp <= now.getTime()),
    )
    .map(({ timestamp }) => timestamp);

  return timestamps.length === 0
    ? null
    : new Date(Math.max(...timestamps)).toISOString();
};
