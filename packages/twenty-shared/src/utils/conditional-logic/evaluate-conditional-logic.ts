import { isNumber, isString } from '@sniptt/guards';

import { compositeTypeDefinitions } from '@/types/composite-types/composite-type-definitions';
import { FieldMetadataType } from '@/types/FieldMetadataType';
import {
  type ConditionalLogicCondition,
  type ConditionalLogicConditionGroup,
  type ConditionalLogicField,
  type ConditionalLogicProperty,
  type ConditionalLogicRule,
} from '@/utils/conditional-logic/conditional-logic-types';
import { isPlainObject } from '@/utils/typeguard/isPlainObject';
import { isDefined } from '@/utils/validation/isDefined';
import { isValidationRuleValueEmpty } from '@/utils/validation-rule/isValidationRuleValueEmpty';
import { validationRuleCompositeFieldTypeByValue } from '@/utils/validation-rule/validationRuleValueRegistry';

type ConditionalLogicRecord = Record<string, unknown>;

const MICROS_PER_UNIT = 1_000_000;

export const getConditionalLogicFieldValue = (
  record: ConditionalLogicRecord,
  field: ConditionalLogicField,
): unknown => {
  if (isDefined(field.joinColumnName)) {
    const relatedRecord = record[field.name];

    return (
      record[field.joinColumnName] ??
      (isPlainObject(relatedRecord) ? relatedRecord.id : undefined) ??
      null
    );
  }

  return record[field.name];
};

// Same emptiness as validation rules: a composite is empty when its meaningful subfields are
export const isConditionalLogicValueEmpty = (
  value: unknown,
  field: Pick<ConditionalLogicField, 'type'>,
): boolean => {
  if (
    isPlainObject(value) &&
    !(value instanceof Date) &&
    compositeTypeDefinitions.has(field.type)
  ) {
    validationRuleCompositeFieldTypeByValue.set(value, field.type);
  }

  return isValidationRuleValueEmpty(value);
};

const toNumber = (value: unknown, field: ConditionalLogicField) => {
  if (field.type === FieldMetadataType.CURRENCY) {
    const amountMicros = isPlainObject(value) ? value.amountMicros : null;
    const parsed = isString(amountMicros) ? Number(amountMicros) : amountMicros;

    return isNumber(parsed) && !Number.isNaN(parsed)
      ? parsed / MICROS_PER_UNIT
      : null;
  }

  const parsed = isString(value) ? Number(value) : value;

  return isNumber(parsed) && !Number.isNaN(parsed) ? parsed : null;
};

// Dates compare by calendar day, date-times by their UTC day
const toDay = (value: unknown): string | null => {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime())
      ? null
      : value.toISOString().slice(0, 10);
  }

  if (!isString(value) || value.length < 10) {
    return null;
  }

  if (value.length === 10) {
    return value;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
};

const toList = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter(isString) : [];

const normalizeText = (value: unknown) =>
  isString(value) ? value.trim().toLowerCase() : null;

export const evaluateConditionalLogicCondition = ({
  condition,
  record,
  fieldByName,
}: {
  condition: ConditionalLogicCondition;
  record: ConditionalLogicRecord;
  fieldByName: ReadonlyMap<string, ConditionalLogicField>;
}): boolean => {
  const field = fieldByName.get(condition.fieldName);

  // A condition on a field that no longer exists never matches, so a stale rule can't block anyone
  if (!isDefined(field)) {
    return false;
  }

  const value = getConditionalLogicFieldValue(record, field);
  const expected = condition.value;

  switch (condition.operator) {
    case 'IS_KNOWN':
      return !isConditionalLogicValueEmpty(value, field);
    case 'IS_UNKNOWN':
      return isConditionalLogicValueEmpty(value, field);
    case 'IS_YES':
      return value === true;
    case 'IS_NO':
      return value === false;
    case 'IS_ANY_OF':
      return isString(value) && toList(expected).includes(value);
    case 'IS_NONE_OF':
      return !(isString(value) && toList(expected).includes(value));
    case 'CONTAINS_ANY_OF':
      return toList(expected).some((option) => toList(value).includes(option));
    case 'CONTAINS_ALL_OF': {
      const options = toList(expected);

      return (
        options.length > 0 &&
        options.every((option) => toList(value).includes(option))
      );
    }
    case 'CONTAINS_NONE_OF':
      return !toList(expected).some((option) => toList(value).includes(option));
    case 'CONTAINS': {
      const text = normalizeText(value);
      const search = normalizeText(expected);

      return isDefined(text) && isDefined(search) && text.includes(search);
    }
    case 'IS_EQUAL_TO':
    case 'IS_NOT_EQUAL_TO': {
      const isNumeric = field.type !== FieldMetadataType.TEXT;
      const actual = isNumeric ? toNumber(value, field) : normalizeText(value);
      const target = isNumeric
        ? toNumber(expected, { ...field, type: FieldMetadataType.NUMBER })
        : normalizeText(expected);

      if (!isDefined(actual) || !isDefined(target)) {
        return false;
      }

      return condition.operator === 'IS_EQUAL_TO'
        ? actual === target
        : actual !== target;
    }
    case 'GREATER_THAN':
    case 'LESS_THAN':
    case 'GREATER_THAN_OR_EQUAL':
    case 'LESS_THAN_OR_EQUAL': {
      const actual = toNumber(value, field);
      const target = toNumber(expected, {
        ...field,
        type: FieldMetadataType.NUMBER,
      });

      if (!isDefined(actual) || !isDefined(target)) {
        return false;
      }

      switch (condition.operator) {
        case 'GREATER_THAN':
          return actual > target;
        case 'LESS_THAN':
          return actual < target;
        case 'GREATER_THAN_OR_EQUAL':
          return actual >= target;
        case 'LESS_THAN_OR_EQUAL':
          return actual <= target;
      }

      return false;
    }
    case 'IS_BEFORE':
    case 'IS_AFTER':
    case 'IS_ON': {
      const actual = toDay(value);
      const target = toDay(expected);

      if (!isDefined(actual) || !isDefined(target)) {
        return false;
      }

      return condition.operator === 'IS_BEFORE'
        ? actual < target
        : condition.operator === 'IS_AFTER'
          ? actual > target
          : actual === target;
    }
  }
};

export const evaluateConditionalLogicGroups = ({
  conditionGroups,
  record,
  fieldByName,
}: {
  conditionGroups: ConditionalLogicConditionGroup[];
  record: ConditionalLogicRecord;
  fieldByName: ReadonlyMap<string, ConditionalLogicField>;
}): boolean =>
  // No groups means only the rule's fixed context applies, which the caller has already checked
  conditionGroups.length === 0 ||
  conditionGroups.some(({ conditions }) =>
    conditions.every((condition) =>
      evaluateConditionalLogicCondition({ condition, record, fieldByName }),
    ),
  );

// Properties of every matching rule, in rule order; a property is required if any matching rule requires it
export const resolveConditionalLogicProperties = ({
  rules,
  record,
  fields,
}: {
  rules: ConditionalLogicRule[];
  record: ConditionalLogicRecord;
  fields: ConditionalLogicField[];
}): ConditionalLogicProperty[] => {
  const fieldByName = new Map(fields.map((field) => [field.name, field]));
  const propertyByFieldName = new Map<string, ConditionalLogicProperty>();

  for (const rule of rules) {
    if (
      !evaluateConditionalLogicGroups({
        conditionGroups: rule.conditionGroups,
        record,
        fieldByName,
      })
    ) {
      continue;
    }

    for (const property of rule.properties) {
      if (!fieldByName.has(property.fieldName)) {
        continue;
      }

      const existing = propertyByFieldName.get(property.fieldName);

      propertyByFieldName.set(property.fieldName, {
        fieldName: property.fieldName,
        isRequired: property.isRequired || (existing?.isRequired ?? false),
      });
    }
  }

  return [...propertyByFieldName.values()];
};

export const findMissingConditionalLogicProperties = ({
  rules,
  record,
  fields,
}: {
  rules: ConditionalLogicRule[];
  record: ConditionalLogicRecord;
  fields: ConditionalLogicField[];
}): ConditionalLogicField[] => {
  const fieldByName = new Map(fields.map((field) => [field.name, field]));

  return resolveConditionalLogicProperties({ rules, record, fields })
    .filter(({ isRequired }) => isRequired)
    .map(({ fieldName }) => fieldByName.get(fieldName))
    .filter(isDefined)
    .filter((field) =>
      isConditionalLogicValueEmpty(
        getConditionalLogicFieldValue(record, field),
        field,
      ),
    );
};
