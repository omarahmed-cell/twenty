import { isNumber } from '@sniptt/guards';

import {
  DEFAULT_PROPERTY_HISTORY_LIMITS,
  MAX_PROPERTY_HISTORY_LIMIT,
  type PropertyHistoryLimits,
} from 'src/modules/timeline/constants/property-history-limits.constant';

const clampLimit = (value: unknown, fallback: number): number =>
  isNumber(value) && Number.isInteger(value) && value >= 1
    ? Math.min(value, MAX_PROPERTY_HISTORY_LIMIT)
    : fallback;

export const parsePropertyHistoryLimits = (
  value: unknown,
): PropertyHistoryLimits => {
  const saved = (value ?? {}) as Partial<Record<string, unknown>>;

  return {
    contacts: clampLimit(
      saved.contacts,
      DEFAULT_PROPERTY_HISTORY_LIMITS.contacts,
    ),
    others: clampLimit(saved.others, DEFAULT_PROPERTY_HISTORY_LIMITS.others),
  };
};

export const getPropertyHistoryLimit = (
  limits: PropertyHistoryLimits,
  objectSingularName: string,
): number =>
  objectSingularName === 'person' ? limits.contacts : limits.others;
