export type RoboostDatePresetRangeKey =
  | 'today'
  | 'yesterday'
  | 'thisWeek'
  | 'lastWeek'
  | 'thisMonth'
  | 'lastMonth';

const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const addDays = (date: Date, days: number) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);

// Weeks start on Monday; the end of each range is exclusive
export const getRoboostDatePresetRange = (
  preset: RoboostDatePresetRangeKey,
  now: Date = new Date(),
): { start: Date; end: Date } => {
  const today = startOfDay(now);
  const weekStart = addDays(today, -((today.getDay() + 6) % 7));
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  switch (preset) {
    case 'today':
      return { start: today, end: addDays(today, 1) };
    case 'yesterday':
      return { start: addDays(today, -1), end: today };
    case 'thisWeek':
      return { start: weekStart, end: addDays(weekStart, 7) };
    case 'lastWeek':
      return { start: addDays(weekStart, -7), end: weekStart };
    case 'thisMonth':
      return {
        start: monthStart,
        end: new Date(today.getFullYear(), today.getMonth() + 1, 1),
      };
    case 'lastMonth':
      return {
        start: new Date(today.getFullYear(), today.getMonth() - 1, 1),
        end: monthStart,
      };
  }
};
