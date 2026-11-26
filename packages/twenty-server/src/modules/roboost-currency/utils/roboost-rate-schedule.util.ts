export const ROBOOST_RATE_FREQUENCIES = [
  'DAILY',
  'MONTHLY',
  'QUARTERLY',
  'YEARLY',
] as const;

export type RoboostRateFrequency = (typeof ROBOOST_RATE_FREQUENCIES)[number];

// The period a date falls in; an update is due once per period
const periodKey = (frequency: RoboostRateFrequency, date: Date) => {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();

  switch (frequency) {
    case 'DAILY':
      return date.toISOString().slice(0, 10);
    case 'MONTHLY':
      return `${year}-${month}`;
    case 'QUARTERLY':
      return `${year}-Q${Math.floor(month / 3)}`;
    case 'YEARLY':
      return `${year}`;
  }
};

export const isUpdateDue = (
  frequency: RoboostRateFrequency,
  lastSuccess: Date | null,
  now: Date,
) =>
  lastSuccess === null ||
  periodKey(frequency, lastSuccess) !== periodKey(frequency, now);

// The day the next update runs (the scheduler runs at 01:00 UTC)
export const computeNextUpdateDate = (
  frequency: RoboostRateFrequency,
  now: Date,
): string => {
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const day = now.getUTCDate();
  const startOfMonth = (y: number, m: number) =>
    new Date(Date.UTC(y, m, 1)).toISOString().slice(0, 10);

  switch (frequency) {
    case 'DAILY':
      return new Date(
        Date.UTC(year, month, day + (now.getUTCHours() >= 1 ? 1 : 0)),
      )
        .toISOString()
        .slice(0, 10);
    case 'MONTHLY':
      return startOfMonth(year, month + 1);
    case 'QUARTERLY':
      return startOfMonth(year, (Math.floor(month / 3) + 1) * 3);
    case 'YEARLY':
      return startOfMonth(year + 1, 0);
  }
};
