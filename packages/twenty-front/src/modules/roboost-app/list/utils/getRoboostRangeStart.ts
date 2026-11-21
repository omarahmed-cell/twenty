import { type RoboostDateRange } from '@/roboost-app/list/types/RoboostListFilters';

const DAYS_BY_RANGE: Partial<Record<RoboostDateRange, number>> = {
  last7: 7,
  last30: 30,
  last90: 90,
  last365: 365,
};

export const getRoboostRangeStart = (
  range: RoboostDateRange,
  now: Date,
): string | undefined => {
  if (range === 'any') {
    return undefined;
  }
  if (range === 'today') {
    return new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    ).toISOString();
  }
  if (range === 'thisQuarter') {
    const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;

    return new Date(now.getFullYear(), quarterStartMonth, 1).toISOString();
  }
  const days = DAYS_BY_RANGE[range] ?? 0;

  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
};
