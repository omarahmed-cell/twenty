import { isNonEmptyString } from '@sniptt/guards';

import {
  type ConditionalLogicField,
  type ConditionalLogicProperty,
  type ConditionalLogicRule,
} from '@/utils/conditional-logic/conditional-logic-types';
import {
  evaluateConditionalLogicGroups,
  findMissingConditionalLogicProperties,
  resolveConditionalLogicProperties,
} from '@/utils/conditional-logic/evaluate-conditional-logic';
import { isDefined } from '@/utils/validation/isDefined';

// A rule can show a whole property group; it is stored as a property entry pointing at the group
const PROPERTY_GROUP_REFERENCE_PREFIX = 'propertyGroup:';

export const toPropertyGroupReference = (propertyGroupId: string) =>
  `${PROPERTY_GROUP_REFERENCE_PREFIX}${propertyGroupId}`;

export const getPropertyGroupIdFromReference = (
  fieldName: string,
): string | null =>
  fieldName.startsWith(PROPERTY_GROUP_REFERENCE_PREFIX)
    ? fieldName.slice(PROPERTY_GROUP_REFERENCE_PREFIX.length)
    : null;

export type PropertyLogicRuleViolation = {
  rule: ConditionalLogicRule;
  missingFields: ConditionalLogicField[];
};

// Replaces group entries with the group's fields in group order; Required on a group applies to each of its fields
export const expandPropertyLogicRule = (
  rule: ConditionalLogicRule,
  fieldNamesByPropertyGroupId: ReadonlyMap<string, string[]>,
): ConditionalLogicRule => {
  const propertyByFieldName = new Map<string, ConditionalLogicProperty>();

  for (const property of rule.properties) {
    const propertyGroupId = getPropertyGroupIdFromReference(property.fieldName);
    const fieldNames = isDefined(propertyGroupId)
      ? (fieldNamesByPropertyGroupId.get(propertyGroupId) ?? [])
      : [property.fieldName];

    for (const fieldName of fieldNames) {
      const existing = propertyByFieldName.get(fieldName);

      propertyByFieldName.set(fieldName, {
        fieldName,
        isRequired: property.isRequired || (existing?.isRequired ?? false),
      });
    }
  }

  return { ...rule, properties: [...propertyByFieldName.values()] };
};

export const getPropertyLogicDependentFieldNames = (
  expandedRules: ConditionalLogicRule[],
): Set<string> =>
  new Set(
    expandedRules.flatMap(({ properties }) =>
      properties.map(({ fieldName }) => fieldName),
    ),
  );

// A dependent stays hidden until one of its rules is true for the record; its value is never touched
export const resolveHiddenPropertyFieldNames = ({
  expandedRules,
  record,
  fields,
}: {
  expandedRules: ConditionalLogicRule[];
  record: Record<string, unknown>;
  fields: ConditionalLogicField[];
}): Set<string> => {
  const shownFieldNames = new Set(
    resolveConditionalLogicProperties({
      rules: expandedRules,
      record,
      fields,
    }).map(({ fieldName }) => fieldName),
  );

  return new Set(
    [...getPropertyLogicDependentFieldNames(expandedRules)].filter(
      (fieldName) => !shownFieldNames.has(fieldName),
    ),
  );
};

export const getPropertyLogicConditionFieldNames = (
  rule: ConditionalLogicRule,
): Set<string> =>
  new Set(
    rule.conditionGroups.flatMap(({ conditions }) =>
      conditions.map(({ fieldName }) => fieldName),
    ),
  );

// Required dependents only bind when a write makes a rule true; later edits of a true rule's record are free
export const findPropertyLogicRuleViolations = ({
  expandedRules,
  previousRecord,
  nextRecord,
  fields,
}: {
  expandedRules: ConditionalLogicRule[];
  previousRecord: Record<string, unknown> | null;
  nextRecord: Record<string, unknown>;
  fields: ConditionalLogicField[];
}): PropertyLogicRuleViolation[] => {
  const fieldByName = new Map(fields.map((field) => [field.name, field]));
  const isTrue = (
    rule: ConditionalLogicRule,
    record: Record<string, unknown>,
  ) =>
    evaluateConditionalLogicGroups({
      conditionGroups: rule.conditionGroups,
      record,
      fieldByName,
    });

  return expandedRules.flatMap((rule) => {
    if (!rule.properties.some(({ isRequired }) => isRequired)) {
      return [];
    }

    const becameTrue =
      isTrue(rule, nextRecord) &&
      (!isDefined(previousRecord) || !isTrue(rule, previousRecord));

    if (!becameTrue) {
      return [];
    }

    const missingFields = findMissingConditionalLogicProperties({
      rules: [rule],
      record: nextRecord,
      fields,
    });

    return missingFields.length > 0 ? [{ rule, missingFields }] : [];
  });
};

const formatConditionValue = (
  value: unknown,
  field: ConditionalLogicField | undefined,
): string | null => {
  const labelOf = (optionValue: string) =>
    field?.options?.find((option) => option.value === optionValue)?.label ??
    optionValue;

  if (Array.isArray(value)) {
    const labels = value.filter(isNonEmptyString).map(labelOf);

    return labels.length > 0 ? labels.join(' or ') : null;
  }

  if (isNonEmptyString(value)) {
    return labelOf(value);
  }

  return typeof value === 'number' ? String(value) : null;
};

// "Products -> DMS": the conditions of the rule's first true group, read from the rule itself
export const describePropertyLogicTrigger = ({
  rule,
  record,
  fields,
}: {
  rule: ConditionalLogicRule;
  record: Record<string, unknown>;
  fields: ConditionalLogicField[];
}): string => {
  const fieldByName = new Map(fields.map((field) => [field.name, field]));
  const trueGroup =
    rule.conditionGroups.find(({ conditions }) =>
      evaluateConditionalLogicGroups({
        conditionGroups: [{ id: 'group', conditions }],
        record,
        fieldByName,
      }),
    ) ?? rule.conditionGroups[0];

  return (trueGroup?.conditions ?? [])
    .map((condition) => {
      const field = fieldByName.get(condition.fieldName);
      const label = field?.label ?? condition.fieldName;
      const value = formatConditionValue(condition.value, field);

      return isDefined(value) ? `${label} -> ${value}` : label;
    })
    .join(', ');
};

export const formatPropertyLogicViolationMessage = ({
  violation,
  record,
  fields,
}: {
  violation: PropertyLogicRuleViolation;
  record: Record<string, unknown>;
  fields: ConditionalLogicField[];
}): string => {
  const trigger = describePropertyLogicTrigger({
    rule: violation.rule,
    record,
    fields,
  });
  const missingLabels = violation.missingFields
    .map(({ label }) => label)
    .join(', ');

  return trigger.length > 0
    ? `${trigger} needs: ${missingLabels}`
    : `Fill: ${missingLabels}`;
};
