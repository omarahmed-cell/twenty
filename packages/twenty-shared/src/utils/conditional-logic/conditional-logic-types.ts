import { type FieldMetadataType } from '@/types/FieldMetadataType';

export type ConditionalLogicOperator =
  | 'IS_KNOWN'
  | 'IS_UNKNOWN'
  | 'IS_EQUAL_TO'
  | 'IS_NOT_EQUAL_TO'
  | 'CONTAINS'
  | 'IS_ANY_OF'
  | 'IS_NONE_OF'
  | 'CONTAINS_ANY_OF'
  | 'CONTAINS_ALL_OF'
  | 'CONTAINS_NONE_OF'
  | 'GREATER_THAN'
  | 'LESS_THAN'
  | 'GREATER_THAN_OR_EQUAL'
  | 'LESS_THAN_OR_EQUAL'
  | 'IS_BEFORE'
  | 'IS_AFTER'
  | 'IS_ON'
  | 'IS_YES'
  | 'IS_NO';

// Text and dates are strings (dates as YYYY-MM-DD), numbers and currency amounts are numbers, list operators take option values or record ids
export type ConditionalLogicConditionValue = string | number | string[] | null;

export type ConditionalLogicCondition = {
  id: string;
  fieldName: string;
  operator: ConditionalLogicOperator;
  value?: ConditionalLogicConditionValue;
};

// Conditions in a group are ANDed; groups are ORed
export type ConditionalLogicConditionGroup = {
  id: string;
  conditions: ConditionalLogicCondition[];
};

export type ConditionalLogicProperty = {
  fieldName: string;
  isRequired: boolean;
};

export type ConditionalLogicRule = {
  id: string;
  conditionGroups: ConditionalLogicConditionGroup[];
  properties: ConditionalLogicProperty[];
};

export type ConditionalLogicField = {
  name: string;
  label: string;
  type: FieldMetadataType;
  // Set for many-to-one relations, whose value is the foreign key
  joinColumnName?: string;
  // Select options, only used to word messages
  options?: { value: string; label: string }[];
};
