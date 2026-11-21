export type RoboostDateRange =
  | 'any'
  | 'today'
  | 'last7'
  | 'last30'
  | 'thisQuarter'
  | 'last90'
  | 'last365';

export type RoboostFilterOperand =
  | 'contains'
  | 'doesNotContain'
  | 'is'
  | 'isNot'
  | 'isAnyOf'
  | 'isNoneOf'
  | 'greaterThan'
  | 'lessThan'
  | 'before'
  | 'after'
  | 'isEmpty'
  | 'isNotEmpty';

export type RoboostFilterRule = {
  id: string;
  fieldName: string;
  operand: RoboostFilterOperand;
  value: string | string[] | null;
};

export type RoboostAdvancedFilter = {
  conjunction: 'and' | 'or';
  rules: RoboostFilterRule[];
};

export type RoboostListFilters = {
  // Relation chip: 'any', 'me', 'none' or a workspace member id
  ownerId: string;
  createdWithin: RoboostDateRange;
  lastActivityWithin: RoboostDateRange;
  selectValuesByFieldName: Record<string, string[]>;
  extraSelectFieldNames: string[];
  advanced: RoboostAdvancedFilter;
};

export const EMPTY_ROBOOST_LIST_FILTERS: RoboostListFilters = {
  ownerId: 'any',
  createdWithin: 'any',
  lastActivityWithin: 'any',
  selectValuesByFieldName: {},
  extraSelectFieldNames: [],
  advanced: { conjunction: 'and', rules: [] },
};
