import { isNonEmptyString } from '@sniptt/guards';

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

export const isBeyondCalendarEventsImportHorizon = ({
  startsAt,
  horizonDays,
  now = new Date(),
}: {
  startsAt: string | null | undefined;
  horizonDays: number;
  now?: Date;
}): boolean => {
  if (!isNonEmptyString(startsAt)) {
    return false;
  }

  const startTime = new Date(startsAt).getTime();

  if (Number.isNaN(startTime)) {
    return false;
  }

  return startTime > now.getTime() + horizonDays * MILLISECONDS_PER_DAY;
};
