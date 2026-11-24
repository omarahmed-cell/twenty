import { isNonEmptyString } from '@sniptt/guards';

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// "system" and unknown zones fall back to UTC, so a bad profile value never breaks a notification
const resolveTimeZone = (timeZone: string | null | undefined) => {
  if (!isNonEmptyString(timeZone) || timeZone === 'system') {
    return 'UTC';
  }
  try {
    new Intl.DateTimeFormat('en-US', { timeZone });

    return timeZone;
  } catch {
    return 'UTC';
  }
};

export const getRoboostLocalClock = (
  date: Date,
  timeZone: string | null | undefined,
) => {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: resolveTimeZone(timeZone),
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(date)
      .map(({ type, value }) => [type, value]),
  );

  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    weekDay: WEEK_DAYS.indexOf(parts.weekday),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
  };
};

// "9 Nov · 09:00" in the recipient's time zone
export const formatRoboostDueTime = (
  date: Date,
  timeZone: string | null | undefined,
) => {
  const zone = resolveTimeZone(timeZone);
  const day = new Intl.DateTimeFormat('en-GB', {
    timeZone: zone,
    day: 'numeric',
    month: 'short',
  }).format(date);
  const time = new Intl.DateTimeFormat('en-GB', {
    timeZone: zone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(date);

  return `${day} · ${time}`;
};
