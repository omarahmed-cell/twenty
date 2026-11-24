export type PropertyHistoryLimits = { contacts: number; others: number };

// Saved from Settings > General as a workspace default user var
export const PROPERTY_HISTORY_LIMITS_KEY =
  'roboost.default.propertyHistoryLimits';

export const DEFAULT_PROPERTY_HISTORY_LIMITS: PropertyHistoryLimits = {
  contacts: 45,
  others: 20,
};

export const MAX_PROPERTY_HISTORY_LIMIT = 1000;
