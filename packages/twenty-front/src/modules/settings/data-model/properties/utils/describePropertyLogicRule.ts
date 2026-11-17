import { t } from '@lingui/core/macro';
import {
  type ConditionalLogicCondition,
  type ConditionalLogicField,
  type ConditionalLogicRule,
  getPropertyGroupIdFromReference,
  isConditionalLogicOperatorValueless,
  isDefined,
} from 'twenty-shared/utils';

import { getConditionalLogicOperatorLabel } from '@/settings/data-model/conditional-logic/utils/getConditionalLogicOperatorLabel';

const describeValue = (
  condition: ConditionalLogicCondition,
  field: ConditionalLogicField | undefined,
) => {
  const labelOf = (value: string) =>
    field?.options?.find((option) => option.value === value)?.label ?? value;
  const values = Array.isArray(condition.value)
    ? condition.value.map(labelOf)
    : isDefined(condition.value)
      ? [labelOf(String(condition.value))]
      : [];

  return values.map((value) => `"${value}"`).join(', ');
};

// Products is any of "DMS", groups joined with OR
export const describePropertyLogicConditions = ({
  rule,
  fields,
}: {
  rule: ConditionalLogicRule;
  fields: ConditionalLogicField[];
}): string => {
  const fieldByName = new Map(fields.map((field) => [field.name, field]));

  return rule.conditionGroups
    .filter(({ conditions }) => conditions.length > 0)
    .map(({ conditions }) =>
      conditions
        .map((condition) => {
          const field = fieldByName.get(condition.fieldName);
          const operator = getConditionalLogicOperatorLabel(condition.operator);
          const label = field?.label ?? condition.fieldName;

          return isConditionalLogicOperatorValueless(condition.operator)
            ? `${label} ${operator}`
            : `${label} ${operator} ${describeValue(condition, field)}`;
        })
        .join(' AND '),
    )
    .join(' OR ');
};

// Group entries read "Group: name"; required entries carry a *
export const describePropertyLogicDependents = ({
  rule,
  fields,
  groupNameById,
}: {
  rule: ConditionalLogicRule;
  fields: ConditionalLogicField[];
  groupNameById: ReadonlyMap<string, string>;
}): string[] => {
  const fieldByName = new Map(fields.map((field) => [field.name, field]));

  return rule.properties.map(({ fieldName, isRequired }) => {
    const propertyGroupId = getPropertyGroupIdFromReference(fieldName);
    const groupName = isDefined(propertyGroupId)
      ? (groupNameById.get(propertyGroupId) ?? '?')
      : undefined;
    const label = isDefined(groupName)
      ? t`Group: ${groupName}`
      : (fieldByName.get(fieldName)?.label ?? fieldName);

    return isRequired ? `${label} *` : label;
  });
};
