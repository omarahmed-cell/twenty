import { isNonEmptyString } from '@sniptt/guards';

// Imported meetings can carry an empty or unknown zone; Intl throws on those
export const resolveRoboostTimeZone = (
  timeZone: string | null | undefined,
  fallbackTimeZone: string,
) => {
  if (!isNonEmptyString(timeZone)) {
    return fallbackTimeZone;
  }
  try {
    new Intl.DateTimeFormat('en-US', { timeZone });

    return timeZone;
  } catch {
    return fallbackTimeZone;
  }
};
