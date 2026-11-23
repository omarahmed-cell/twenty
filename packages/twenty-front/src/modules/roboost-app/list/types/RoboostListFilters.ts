import { type RoboostFilterOperator } from '@/roboost-app/filters/types/RoboostFilterOperator';
import { type RoboostFilterRuleValue } from '@/roboost-app/filters/utils/buildRoboostFilterRule';
import { type RecordGqlOperationFilter } from 'twenty-shared/types';

export type RoboostDateRange =
  | 'any'
  | 'today'
  | 'last7'
  | 'last30'
  | 'thisQuarter'
  | 'last90'
  | 'last365';

export type RoboostFilterRule = {
  id: string;
  fieldName: string;
  operator: RoboostFilterOperator;
  value: RoboostFilterRuleValue;
  // Display names of picked records, so relation chips never show bare ids
  labels?: Record<string, string>;
};

// Rules in a group must all match; a record matches when any group does
export type RoboostFilterGroup = {
  id: string;
  rules: RoboostFilterRule[];
};

// Conditions on a related object's fields, resolved to the matching record ids when applied
export type RoboostAssociationFilter = {
  id: string;
  relationFieldName: string;
  rules: RoboostFilterRule[];
  resolvedFilter: RecordGqlOperationFilter | null;
};

export type RoboostAdvancedFilter = {
  groups: RoboostFilterGroup[];
  associations: RoboostAssociationFilter[];
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
  advanced: { groups: [], associations: [] },
};
