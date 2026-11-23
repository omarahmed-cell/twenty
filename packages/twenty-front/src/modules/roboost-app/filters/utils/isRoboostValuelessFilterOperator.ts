import { type RoboostFilterOperator } from '@/roboost-app/filters/types/RoboostFilterOperator';

const VALUELESS_OPERATORS = new Set<RoboostFilterOperator>([
  'isKnown',
  'isUnknown',
  'isToday',
  'isYesterday',
  'isThisWeek',
  'isLastWeek',
  'isThisMonth',
  'isLastMonth',
  'isThisQuarter',
  'isThisYear',
]);

export const isRoboostValuelessFilterOperator = (
  operator: RoboostFilterOperator,
) => VALUELESS_OPERATORS.has(operator);
