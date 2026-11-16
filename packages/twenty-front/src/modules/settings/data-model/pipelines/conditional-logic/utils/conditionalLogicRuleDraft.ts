import {
  type ConditionalLogicCondition,
  type ConditionalLogicConditionGroup,
  type ConditionalLogicConditionValue,
  type ConditionalLogicField,
  type ConditionalLogicOperator,
  type ConditionalLogicRule,
  getConditionalLogicOperators,
  isConditionalLogicListOperator,
  isConditionalLogicOperatorValueless,
  isDefined,
} from 'twenty-shared/utils';
import { v4 } from 'uuid';

const createConditionGroup = (): ConditionalLogicConditionGroup => ({
  id: v4(),
  conditions: [],
});

export const createConditionalLogicRuleDraft = (): ConditionalLogicRule => ({
  id: v4(),
  conditionGroups: [createConditionGroup()],
  properties: [],
});

const getDefaultConditionValue = (
  operator: ConditionalLogicOperator,
): ConditionalLogicConditionValue | undefined => {
  if (isConditionalLogicOperatorValueless(operator)) {
    return undefined;
  }

  return isConditionalLogicListOperator(operator) ? [] : null;
};

const mapGroup = (
  rule: ConditionalLogicRule,
  groupId: string,
  update: (
    group: ConditionalLogicConditionGroup,
  ) => ConditionalLogicConditionGroup,
): ConditionalLogicRule => ({
  ...rule,
  conditionGroups: rule.conditionGroups.map((group) =>
    group.id === groupId ? update(group) : group,
  ),
});

export const addConditionalLogicGroup = (
  rule: ConditionalLogicRule,
): ConditionalLogicRule => ({
  ...rule,
  conditionGroups: [...rule.conditionGroups, createConditionGroup()],
});

// Every rule keeps one group, since the stage condition lives in it
export const removeConditionalLogicGroup = (
  rule: ConditionalLogicRule,
  groupId: string,
): ConditionalLogicRule =>
  rule.conditionGroups.length <= 1
    ? rule
    : {
        ...rule,
        conditionGroups: rule.conditionGroups.filter(
          (group) => group.id !== groupId,
        ),
      };

export const addConditionalLogicCondition = (
  rule: ConditionalLogicRule,
  groupId: string,
  field: ConditionalLogicField,
): ConditionalLogicRule => {
  const [operator] = getConditionalLogicOperators(field);

  if (!isDefined(operator)) {
    return rule;
  }

  const condition: ConditionalLogicCondition = {
    id: v4(),
    fieldName: field.name,
    operator,
    value: getDefaultConditionValue(operator),
  };

  return mapGroup(rule, groupId, (group) => ({
    ...group,
    conditions: [...group.conditions, condition],
  }));
};

export const changeConditionalLogicConditionField = (
  rule: ConditionalLogicRule,
  groupId: string,
  conditionId: string,
  field: ConditionalLogicField,
): ConditionalLogicRule => {
  const [operator] = getConditionalLogicOperators(field);

  if (!isDefined(operator)) {
    return rule;
  }

  return mapGroup(rule, groupId, (group) => ({
    ...group,
    conditions: group.conditions.map((condition) =>
      condition.id === conditionId
        ? {
            id: condition.id,
            fieldName: field.name,
            operator,
            value: getDefaultConditionValue(operator),
          }
        : condition,
    ),
  }));
};

const hasSameValueShape = (
  previous: ConditionalLogicOperator,
  next: ConditionalLogicOperator,
) =>
  isConditionalLogicOperatorValueless(previous) ===
    isConditionalLogicOperatorValueless(next) &&
  isConditionalLogicListOperator(previous) ===
    isConditionalLogicListOperator(next);

export const changeConditionalLogicConditionOperator = (
  rule: ConditionalLogicRule,
  groupId: string,
  conditionId: string,
  operator: ConditionalLogicOperator,
): ConditionalLogicRule =>
  mapGroup(rule, groupId, (group) => ({
    ...group,
    conditions: group.conditions.map((condition) =>
      condition.id === conditionId
        ? {
            ...condition,
            operator,
            value: hasSameValueShape(condition.operator, operator)
              ? condition.value
              : getDefaultConditionValue(operator),
          }
        : condition,
    ),
  }));

export const changeConditionalLogicConditionValue = (
  rule: ConditionalLogicRule,
  groupId: string,
  conditionId: string,
  value: ConditionalLogicConditionValue,
): ConditionalLogicRule =>
  mapGroup(rule, groupId, (group) => ({
    ...group,
    conditions: group.conditions.map((condition) =>
      condition.id === conditionId ? { ...condition, value } : condition,
    ),
  }));

export const removeConditionalLogicCondition = (
  rule: ConditionalLogicRule,
  groupId: string,
  conditionId: string,
): ConditionalLogicRule =>
  mapGroup(rule, groupId, (group) => ({
    ...group,
    conditions: group.conditions.filter(
      (condition) => condition.id !== conditionId,
    ),
  }));

export const addConditionalLogicProperty = (
  rule: ConditionalLogicRule,
  fieldName: string,
): ConditionalLogicRule =>
  rule.properties.some((property) => property.fieldName === fieldName)
    ? rule
    : {
        ...rule,
        properties: [...rule.properties, { fieldName, isRequired: true }],
      };

export const setConditionalLogicPropertyRequired = (
  rule: ConditionalLogicRule,
  fieldName: string,
  isRequired: boolean,
): ConditionalLogicRule => ({
  ...rule,
  properties: rule.properties.map((property) =>
    property.fieldName === fieldName ? { ...property, isRequired } : property,
  ),
});

export const removeConditionalLogicProperty = (
  rule: ConditionalLogicRule,
  fieldName: string,
): ConditionalLogicRule => ({
  ...rule,
  properties: rule.properties.filter(
    (property) => property.fieldName !== fieldName,
  ),
});

export const moveConditionalLogicProperty = (
  rule: ConditionalLogicRule,
  fromIndex: number,
  toIndex: number,
): ConditionalLogicRule => {
  const properties = [...rule.properties];
  const [moved] = properties.splice(fromIndex, 1);

  if (!isDefined(moved)) {
    return rule;
  }

  properties.splice(toIndex, 0, moved);

  return { ...rule, properties };
};

const isConditionComplete = (condition: ConditionalLogicCondition) => {
  if (isConditionalLogicOperatorValueless(condition.operator)) {
    return true;
  }

  const { value } = condition;

  return Array.isArray(value)
    ? value.length > 0
    : isDefined(value) && value !== '';
};

export const isConditionalLogicRuleDraftValid = (rule: ConditionalLogicRule) =>
  rule.properties.length > 0 &&
  rule.conditionGroups.every((group) =>
    group.conditions.every(isConditionComplete),
  );

export const upsertConditionalLogicRule = (
  rules: ConditionalLogicRule[],
  rule: ConditionalLogicRule,
): ConditionalLogicRule[] =>
  rules.some(({ id }) => id === rule.id)
    ? rules.map((existing) => (existing.id === rule.id ? rule : existing))
    : [...rules, rule];

export const removeConditionalLogicRule = (
  rules: ConditionalLogicRule[],
  ruleId: string,
): ConditionalLogicRule[] => rules.filter(({ id }) => id !== ruleId);
