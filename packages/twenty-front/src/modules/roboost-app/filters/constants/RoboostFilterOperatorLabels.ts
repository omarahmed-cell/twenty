import { type RoboostFilterOperator } from '@/roboost-app/filters/types/RoboostFilterOperator';
import { msg } from '@lingui/core/macro';
import { type MessageDescriptor } from '@lingui/core';

// HubSpot's wording, used for list filters, advanced filters and conditional logic alike
export const ROBOOST_FILTER_OPERATOR_LABELS: Record<
  RoboostFilterOperator,
  MessageDescriptor
> = {
  isEqualToAnyOf: msg`is equal to any of`,
  isNotEqualToAnyOf: msg`is not equal to any of`,
  containsAnyOf: msg`contains any of`,
  doesNotContainAnyOf: msg`doesn't contain any of`,
  startsWithAnyOf: msg`starts with any of`,
  endsWithAnyOf: msg`ends with any of`,
  isEqualTo: msg`is equal to`,
  isNotEqualTo: msg`is not equal to`,
  isMoreThan: msg`is more than`,
  isMoreThanOrEqualTo: msg`is more than or equal to`,
  isLessThan: msg`is less than`,
  isLessThanOrEqualTo: msg`is less than or equal to`,
  isBetween: msg`is between`,
  isNotBetween: msg`is not between`,
  isOn: msg`is`,
  isBefore: msg`is before`,
  isAfter: msg`is after`,
  isMoreThanDaysAgo: msg`is more than X days ago`,
  isLessThanDaysAgo: msg`is less than X days ago`,
  isMoreThanDaysFromNow: msg`is more than X days from now`,
  isLessThanDaysFromNow: msg`is less than X days from now`,
  isToday: msg`Today`,
  isYesterday: msg`Yesterday`,
  isThisWeek: msg`This week`,
  isLastWeek: msg`Last week`,
  isThisMonth: msg`This month`,
  isLastMonth: msg`Last month`,
  isThisQuarter: msg`This quarter`,
  isThisYear: msg`This year`,
  isAnyOf: msg`is any of`,
  isNoneOf: msg`is none of`,
  isAllOf: msg`is all of`,
  isExactly: msg`is exactly`,
  isKnown: msg`is known`,
  isUnknown: msg`is unknown`,
};
