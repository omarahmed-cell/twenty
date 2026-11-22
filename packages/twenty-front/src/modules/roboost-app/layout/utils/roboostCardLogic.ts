import { t } from '@lingui/core/macro';
import { type RoboostCardLogic } from '@/roboost-app/layout/types/RoboostRecordLayout';
import {
  type ConditionalLogicCondition,
  type ConditionalLogicField,
  type ConditionalLogicOperator,
  evaluateConditionalLogicGroups,
  getConditionalLogicOperators,
  isConditionalLogicOperatorValueless,
  isDefined,
} from 'twenty-shared/utils';
import { FieldMetadataType } from 'twenty-shared/types';

export const getRoboostOperatorLabel = (
  operator: ConditionalLogicOperator,
): string => {
  switch (operator) {
    case 'IS_KNOWN':
      return t`is not empty`;
    case 'IS_UNKNOWN':
      return t`is empty`;
    case 'IS_EQUAL_TO':
      return t`equals`;
    case 'IS_NOT_EQUAL_TO':
      return t`does not equal`;
    case 'CONTAINS':
      return t`contains`;
    case 'IS_ANY_OF':
      return t`is any of`;
    case 'IS_NONE_OF':
      return t`is none of`;
    case 'CONTAINS_ANY_OF':
      return t`contains any of`;
    case 'CONTAINS_ALL_OF':
      return t`contains all of`;
    case 'CONTAINS_NONE_OF':
      return t`contains none of`;
    case 'GREATER_THAN':
      return t`is greater than`;
    case 'LESS_THAN':
      return t`is less than`;
    case 'GREATER_THAN_OR_EQUAL':
      return t`is at least`;
    case 'LESS_THAN_OR_EQUAL':
      return t`is at most`;
    case 'IS_BEFORE':
      return t`is before`;
    case 'IS_AFTER':
      return t`is after`;
    case 'IS_ON':
      return t`is on`;
    case 'IS_YES':
      return t`is Yes`;
    case 'IS_NO':
      return t`is No`;
  }
};

// A related record's id has no readable value to type, so relations only test for emptiness
export const getRoboostCardLogicOperators = (
  field: ConditionalLogicField,
): ConditionalLogicOperator[] =>
  field.type === FieldMetadataType.RELATION
    ? ['IS_KNOWN', 'IS_UNKNOWN']
    : getConditionalLogicOperators(field);

export const hasRoboostCardLogic = (logic: RoboostCardLogic | undefined) =>
  isDefined(logic) &&
  logic.conditionGroups.some((group) => group.conditions.length > 0);

export const isRoboostCardVisible = ({
  logic,
  record,
  fieldByName,
}: {
  logic: RoboostCardLogic | undefined;
  record: Record<string, unknown>;
  fieldByName: ReadonlyMap<string, ConditionalLogicField>;
}): boolean => {
  if (!isDefined(logic) || !hasRoboostCardLogic(logic)) {
    return true;
  }
  const conditionGroups = logic.conditionGroups
    .map((group) => ({
      ...group,
      conditions: group.conditions.filter((condition) =>
        fieldByName.has(condition.fieldName),
      ),
    }))
    .filter((group) => group.conditions.length > 0);

  if (conditionGroups.length === 0) {
    return true;
  }
  const isMatch = evaluateConditionalLogicGroups({
    conditionGroups,
    record,
    fieldByName,
  });

  return logic.action === 'show' ? isMatch : !isMatch;
};

export const getRoboostCardLogicFieldNames = (
  logic: RoboostCardLogic | undefined,
): string[] =>
  logic?.conditionGroups.flatMap((group) =>
    group.conditions.map((condition) => condition.fieldName),
  ) ?? [];

const formatConditionValue = (
  condition: ConditionalLogicCondition,
  field: ConditionalLogicField | undefined,
): string => {
  const values = Array.isArray(condition.value)
    ? condition.value
    : isDefined(condition.value)
      ? [String(condition.value)]
      : [];

  return values
    .map(
      (value) =>
        field?.options?.find((option) => option.value === value)?.label ??
        value,
    )
    .join(', ');
};

export type RoboostCardLogicSummaryPart = { text: string; isStrong: boolean };

// "Sales information will be Shown in this view if Lead status is any of Open"
export const describeRoboostCardLogic = ({
  cardTitle,
  logic,
  fieldByName,
}: {
  cardTitle: string;
  logic: RoboostCardLogic;
  fieldByName: ReadonlyMap<string, ConditionalLogicField>;
}): RoboostCardLogicSummaryPart[] => {
  const strong = (text: string) => ({ text, isStrong: true });
  const plain = (text: string) => ({ text, isStrong: false });
  const groups = logic.conditionGroups.filter(
    (group) => group.conditions.length > 0,
  );
  const parts: RoboostCardLogicSummaryPart[] = [
    strong(cardTitle),
    plain(` ${t`will be`} `),
    strong(logic.action === 'show' ? t`Shown` : t`Hidden`),
    plain(` ${t`in this view`}`),
  ];

  if (groups.length === 0) {
    return [...parts, plain(` ${t`always`}`)];
  }
  parts.push(plain(`, ${t`if`} `));
  groups.forEach((group, groupIndex) => {
    if (groupIndex > 0) {
      parts.push(strong(` ${t`OR`} `));
    }
    group.conditions.forEach((condition, conditionIndex) => {
      const field = fieldByName.get(condition.fieldName);

      if (conditionIndex > 0) {
        parts.push(strong(` ${t`AND`} `));
      }
      parts.push(strong(field?.label ?? condition.fieldName));
      parts.push(plain(` ${getRoboostOperatorLabel(condition.operator)}`));
      if (!isConditionalLogicOperatorValueless(condition.operator)) {
        parts.push(plain(' '));
        parts.push(strong(formatConditionValue(condition, field)));
      }
    });
  });

  return parts;
};
