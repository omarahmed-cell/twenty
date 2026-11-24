import { isNonEmptyString, isObject, isString } from '@sniptt/guards';

import {
  type RoboostScoreAction,
  type RoboostScoreCondition,
  type RoboostScoreCriteria,
  type RoboostScoreGroup,
  type RoboostScoreRuleSet,
  type RoboostScoreValuePoints,
  roundRoboostScorePoints,
} from '@/utils/scoring/roboost-score-criteria';
import { type RoboostFilterOperator } from '@/utils/roboost-filter/roboost-filter-operator';

const asArray = (value: unknown): unknown[] =>
  Array.isArray(value) ? value : [];

const asRecord = (value: unknown): Record<string, unknown> =>
  isObject(value) && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const asPoints = (value: unknown): number | null => {
  const number = typeof value === 'number' ? value : Number(value);

  return value === null || value === '' || !Number.isFinite(number)
    ? null
    : roundRoboostScorePoints(Math.abs(number));
};

const asAction = (value: unknown): RoboostScoreAction =>
  value === 'subtract' ? 'subtract' : 'add';

const asId = (value: unknown, fallback: string) =>
  isNonEmptyString(value) ? value.slice(0, 64) : fallback;

const parseCondition = (raw: unknown, index: number): RoboostScoreCondition => {
  const condition = asRecord(raw);
  const labels = asRecord(condition.labels);

  return {
    id: asId(condition.id, `c${index}`),
    fieldName: isNonEmptyString(condition.fieldName)
      ? condition.fieldName
      : null,
    operand: isNonEmptyString(condition.operand)
      ? (condition.operand as RoboostFilterOperator)
      : null,
    value: Array.isArray(condition.value)
      ? condition.value.filter(isString).slice(0, 500)
      : isString(condition.value)
        ? [condition.value]
        : null,
    ...(Object.keys(labels).length > 0
      ? {
          labels: Object.fromEntries(
            Object.entries(labels).filter(([, label]) => isString(label)),
          ) as Record<string, string>,
        }
      : {}),
  };
};

const parseRuleSet = (raw: unknown, index: number): RoboostScoreRuleSet => {
  const ruleSet = asRecord(raw);

  return {
    id: asId(ruleSet.id, `r${index}`),
    conditions: asArray(ruleSet.conditions).map(parseCondition),
    mode: ruleSet.mode === 'perValue' ? 'perValue' : 'fixed',
    action: asAction(ruleSet.action),
    points: asPoints(ruleSet.points),
    valuePoints: asArray(ruleSet.valuePoints).flatMap(
      (rawValuePoint): RoboostScoreValuePoints[] => {
        const valuePoint = asRecord(rawValuePoint);

        return isString(valuePoint.value)
          ? [
              {
                value: valuePoint.value,
                action: asAction(valuePoint.action),
                points: asPoints(valuePoint.points),
              },
            ]
          : [];
      },
    ),
    collapsed: ruleSet.collapsed === true,
  };
};

const parseGroup = (raw: unknown, index: number): RoboostScoreGroup => {
  const group = asRecord(raw);
  const limit = asPoints(group.limit);

  return {
    id: asId(group.id, `g${index}`),
    name: isString(group.name) ? group.name.slice(0, 200) : '',
    limit: limit !== null && limit > 0 ? limit : null,
    collapsed: group.collapsed === true,
    ruleSets: asArray(group.ruleSets).map(parseRuleSet),
  };
};

// Criteria arrive as JSON from the editor; anything unexpected is dropped rather than trusted
export const parseRoboostScoreCriteria = (
  raw: unknown,
): RoboostScoreCriteria => {
  const criteria = asRecord(raw);
  const scoreMin = Number(criteria.scoreMin);
  const scoreMax = Number(criteria.scoreMax);
  const hasLimits =
    Number.isFinite(scoreMin) &&
    Number.isFinite(scoreMax) &&
    scoreMin < scoreMax;

  return {
    scoreMin: hasLimits ? scoreMin : -100,
    scoreMax: hasLimits ? scoreMax : 100,
    groups: asArray(criteria.groups).slice(0, 200).map(parseGroup),
  };
};
