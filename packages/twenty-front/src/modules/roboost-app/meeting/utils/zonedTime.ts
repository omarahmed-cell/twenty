export type ZonedParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  weekday: number;
};

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

const pad = (value: number) => String(value).padStart(2, '0');

export const getZonedParts = (date: Date, timeZone: string): ZonedParts => {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      weekday: 'short',
      hourCycle: 'h23',
    })
      .formatToParts(date)
      .map(({ type, value }) => [type, value]),
  );

  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour) % 24,
    minute: Number(parts.minute),
    weekday: WEEKDAY_INDEX[parts.weekday] ?? 0,
  };
};

const getOffsetMilliseconds = (date: Date, timeZone: string) => {
  const parts = getZonedParts(date, timeZone);

  return (
    Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute) -
    Math.floor(date.getTime() / 60000) * 60000
  );
};

// A wall-clock date and time in a timezone, as a UTC ISO string; checked twice around DST changes
export const zonedDateTimeToIso = (
  date: string,
  time: string,
  timeZone: string,
) => {
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  const wallClock = Date.UTC(year, month - 1, day, hour, minute);
  let utc = wallClock - getOffsetMilliseconds(new Date(wallClock), timeZone);

  utc = wallClock - getOffsetMilliseconds(new Date(utc), timeZone);

  return new Date(utc).toISOString();
};

export const toZonedDateString = (date: Date, timeZone: string) => {
  const parts = getZonedParts(date, timeZone);

  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;
};

export const toZonedTimeString = (date: Date, timeZone: string) => {
  const parts = getZonedParts(date, timeZone);

  return `${pad(parts.hour)}:${pad(parts.minute)}`;
};

export const addDaysToDateString = (date: string, days: number) => {
  const [year, month, day] = date.split('-').map(Number);
  const result = new Date(Date.UTC(year, month - 1, day + days));

  return `${result.getUTCFullYear()}-${pad(result.getUTCMonth() + 1)}-${pad(result.getUTCDate())}`;
};

export const getWeekdayOfDateString = (date: string) => {
  const [year, month, day] = date.split('-').map(Number);

  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
};

export const addMinutesToTimeString = (time: string, minutes: number) => {
  const [hour, minute] = time.split(':').map(Number);
  const total = Math.min(
    Math.max(hour * 60 + minute + minutes, 0),
    24 * 60 - 1,
  );

  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
};

export const timeStringToMinutes = (time: string) => {
  const [hour, minute] = time.split(':').map(Number);

  return hour * 60 + minute;
};

export const minutesToTimeString = (minutes: number) =>
  `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
