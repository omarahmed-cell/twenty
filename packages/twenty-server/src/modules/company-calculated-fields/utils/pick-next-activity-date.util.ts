import { isDefined } from 'twenty-shared/utils';

export type NextActivityCandidate = {
  activityType: string;
  date: string | Date | null;
  status?: string | null;
};

// Meetings count until they start; tasks count until their due date passes or they are marked DONE
export const pickNextActivityDate = ({
  candidates,
  now,
}: {
  candidates: NextActivityCandidate[];
  now: Date;
}): string | null => {
  const timestamps = candidates
    .filter(
      ({ activityType, status }) =>
        !(activityType === 'task' && status === 'DONE'),
    )
    .filter(({ date }) => isDefined(date))
    .map(({ date }) => new Date(date as string | Date).getTime())
    .filter(
      (timestamp) => !Number.isNaN(timestamp) && timestamp > now.getTime(),
    );

  return timestamps.length === 0
    ? null
    : new Date(Math.min(...timestamps)).toISOString();
};
