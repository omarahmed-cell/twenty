export type RoboostFilterOperator =
  | 'isEqualToAnyOf'
  | 'isNotEqualToAnyOf'
  | 'containsAnyOf'
  | 'doesNotContainAnyOf'
  | 'startsWithAnyOf'
  | 'endsWithAnyOf'
  | 'isEqualTo'
  | 'isNotEqualTo'
  | 'isMoreThan'
  | 'isMoreThanOrEqualTo'
  | 'isLessThan'
  | 'isLessThanOrEqualTo'
  | 'isBetween'
  | 'isNotBetween'
  | 'isOn'
  | 'isBefore'
  | 'isAfter'
  | 'isMoreThanDaysAgo'
  | 'isLessThanDaysAgo'
  | 'isMoreThanDaysFromNow'
  | 'isLessThanDaysFromNow'
  | 'isToday'
  | 'isYesterday'
  | 'isThisWeek'
  | 'isLastWeek'
  | 'isThisMonth'
  | 'isLastMonth'
  | 'isThisQuarter'
  | 'isThisYear'
  | 'isAnyOf'
  | 'isNoneOf'
  | 'isAllOf'
  | 'isExactly'
  | 'isKnown'
  | 'isUnknown';

export type RoboostFilterFieldKind =
  | 'text'
  | 'number'
  | 'currency'
  | 'date'
  | 'select'
  | 'multiSelect'
  | 'boolean'
  | 'relation';

export const ROBOOST_FILTER_OPERATORS_BY_KIND: Record<
  RoboostFilterFieldKind,
  RoboostFilterOperator[]
> = {
  text: [
    'isEqualToAnyOf',
    'isNotEqualToAnyOf',
    'containsAnyOf',
    'doesNotContainAnyOf',
    'startsWithAnyOf',
    'endsWithAnyOf',
    'isKnown',
    'isUnknown',
  ],
  number: [
    'isEqualTo',
    'isNotEqualTo',
    'isMoreThan',
    'isMoreThanOrEqualTo',
    'isLessThan',
    'isLessThanOrEqualTo',
    'isBetween',
    'isNotBetween',
    'isKnown',
    'isUnknown',
  ],
  currency: [
    'isEqualTo',
    'isNotEqualTo',
    'isMoreThan',
    'isMoreThanOrEqualTo',
    'isLessThan',
    'isLessThanOrEqualTo',
    'isBetween',
    'isNotBetween',
    'isKnown',
    'isUnknown',
  ],
  date: [
    'isOn',
    'isBefore',
    'isAfter',
    'isBetween',
    'isMoreThanDaysAgo',
    'isLessThanDaysAgo',
    'isMoreThanDaysFromNow',
    'isLessThanDaysFromNow',
    'isToday',
    'isYesterday',
    'isThisWeek',
    'isLastWeek',
    'isThisMonth',
    'isLastMonth',
    'isThisQuarter',
    'isThisYear',
    'isKnown',
    'isUnknown',
  ],
  select: ['isAnyOf', 'isNoneOf', 'isKnown', 'isUnknown'],
  multiSelect: [
    'isAnyOf',
    'isAllOf',
    'isNoneOf',
    'isExactly',
    'isKnown',
    'isUnknown',
  ],
  boolean: ['isEqualTo', 'isNotEqualTo', 'isKnown', 'isUnknown'],
  relation: ['isAnyOf', 'isNoneOf', 'isKnown', 'isUnknown'],
};

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

export const isRoboostTwoValueFilterOperator = (
  operator: RoboostFilterOperator,
) => operator === 'isBetween' || operator === 'isNotBetween';
