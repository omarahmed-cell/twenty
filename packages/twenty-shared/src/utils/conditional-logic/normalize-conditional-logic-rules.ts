import { isNonEmptyString, isNumber, isString } from '@sniptt/guards';

import {
  type ConditionalLogicCondition,
  type ConditionalLogicConditionGroup,
  type ConditionalLogicConditionValue,
  type ConditionalLogicOperator,
  type ConditionalLogicProperty,
  type ConditionalLogicRule,
} from '@/utils/conditional-logic/conditional-logic-types';
import { isPlainObject } from '@/utils/typeguard/isPlainObject';
import { isDefined } from '@/utils/validation/isDefined';

const OPERATORS = new Set<ConditionalLogicOperator>([
  'IS_KNOWN',
  'IS_UNKNOWN',
  'IS_EQUAL_TO',
  'IS_NOT_EQUAL_TO',
  'CONTAINS',
  'IS_ANY_OF',
  'IS_NONE_OF',
  'CONTAINS_ANY_OF',
  'CONTAINS_ALL_OF',
  'CONTAINS_NONE_OF',
  'GREATER_THAN',
  'LESS_THAN',
  'GREATER_THAN_OR_EQUAL',
  'LESS_THAN_OR_EQUAL',
  'IS_BEFORE',
  'IS_AFTER',
  'IS_ON',
  'IS_YES',
  'IS_NO',
]);

const isOperator = (value: unknown): value is ConditionalLogicOperator =>
  isString(value) && OPERATORS.has(value as ConditionalLogicOperator);

const toConditionValue = (value: unknown): ConditionalLogicConditionValue => {
  if (isString(value) || isNumber(value)) {
    return value;
  }

  return Array.isArray(value) ? value.filter(isString) : null;
};

const toCondition = (value: unknown): ConditionalLogicCondition | null =>
  isPlainObject(value) &&
  isNonEmptyString(value.id) &&
  isNonEmptyString(value.fieldName) &&
  isOperator(value.operator)
    ? {
        id: value.id,
        fieldName: value.fieldName,
        operator: value.operator,
        value: toConditionValue(value.value),
      }
    : null;

const toGroup = (value: unknown): ConditionalLogicConditionGroup | null =>
  isPlainObject(value) && isNonEmptyString(value.id)
    ? {
        id: value.id,
        conditions: (Array.isArray(value.conditions) ? value.conditions : [])
          .map(toCondition)
          .filter(isDefined),
      }
    : null;

const toProperty = (value: unknown): ConditionalLogicProperty | null =>
  isPlainObject(value) && isNonEmptyString(value.fieldName)
    ? { fieldName: value.fieldName, isRequired: value.isRequired !== false }
    : null;

const toRule = (value: unknown): ConditionalLogicRule | null =>
  isPlainObject(value) && isNonEmptyString(value.id)
    ? {
        id: value.id,
        conditionGroups: (Array.isArray(value.conditionGroups)
          ? value.conditionGroups
          : []
        )
          .map(toGroup)
          .filter(isDefined),
        properties: (Array.isArray(value.properties) ? value.properties : [])
          .map(toProperty)
          .filter(isDefined),
      }
    : null;

// Stored rules are plain JSON that anyone with API access can write, so anything malformed is dropped
export const normalizeConditionalLogicRules = (
  value: unknown,
): ConditionalLogicRule[] =>
  (Array.isArray(value) ? value : []).map(toRule).filter(isDefined);
