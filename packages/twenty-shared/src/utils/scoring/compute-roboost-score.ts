import { isNonEmptyString } from '@sniptt/guards';

import {
  isRoboostTwoValueFilterOperator,
  isRoboostValuelessFilterOperator,
} from '@/utils/roboost-filter/roboost-filter-operator';
import {
  getRoboostSignedPoints,
  roundRoboostScorePoints,
  type RoboostScoreCondition,
  type RoboostScoreCriteria,
  type RoboostScoreRuleSet,
} from '@/utils/scoring/roboost-score-criteria';

export type RoboostRuleSetMatch = {
  matched: boolean;
  matchedValues: string[];
};

export type RoboostScoreRuleSetResult = {
  id: string;
  matched: boolean;
  points: number;
  matchedValues: string[];
};

export type RoboostScoreGroupResult = {
  id: string;
  name: string;
  limit: number | null;
  raw: number;
  applied: number;
  ruleSets: RoboostScoreRuleSetResult[];
};

export type RoboostScoreBreakdown = {
  total: number;
  rawTotal: number;
  scoreMin: number;
  scoreMax: number;
  matchedRuleSetCount: number;
  ruleSetCount: number;
  groups: RoboostScoreGroupResult[];
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

// Group results are capped to [-limit, +limit]; the total is clamped to the score limits
export const computeRoboostScoreBreakdown = (
  criteria: RoboostScoreCriteria,
  matchesByRuleSetId: Record<string, RoboostRuleSetMatch | undefined>,
): RoboostScoreBreakdown => {
  let matchedRuleSetCount = 0;
  let ruleSetCount = 0;

  const groups = criteria.groups.map((group): RoboostScoreGroupResult => {
    const ruleSets = group.ruleSets.map(
      (ruleSet): RoboostScoreRuleSetResult => {
        const match = matchesByRuleSetId[ruleSet.id];
        const matchedValues = match?.matchedValues ?? [];
        const isPerValue = ruleSet.mode === 'perValue';
        const matched = isPerValue
          ? matchedValues.length > 0
          : match?.matched === true;
        const points = !matched
          ? 0
          : isPerValue
            ? roundRoboostScorePoints(
                ruleSet.valuePoints
                  .filter((valuePoint) =>
                    matchedValues.includes(valuePoint.value),
                  )
                  .reduce(
                    (sum, valuePoint) =>
                      sum +
                      getRoboostSignedPoints(
                        valuePoint.action,
                        valuePoint.points,
                      ),
                    0,
                  ),
              )
            : getRoboostSignedPoints(ruleSet.action, ruleSet.points);

        ruleSetCount += 1;
        matchedRuleSetCount += matched ? 1 : 0;

        return { id: ruleSet.id, matched, points, matchedValues };
      },
    );
    const raw = roundRoboostScorePoints(
      ruleSets.reduce((sum, ruleSet) => sum + ruleSet.points, 0),
    );
    const limit = group.limit !== null && group.limit > 0 ? group.limit : null;

    return {
      id: group.id,
      name: group.name,
      limit,
      raw,
      applied: limit === null ? raw : clamp(raw, -limit, limit),
      ruleSets,
    };
  });
  const rawTotal = roundRoboostScorePoints(
    groups.reduce((sum, group) => sum + group.applied, 0),
  );

  return {
    total: clamp(rawTotal, criteria.scoreMin, criteria.scoreMax),
    rawTotal,
    scoreMin: criteria.scoreMin,
    scoreMax: criteria.scoreMax,
    matchedRuleSetCount,
    ruleSetCount,
    groups,
  };
};

// A multi-select record can match several values at once, so its per-value maximum is the sum
export const getRoboostRuleSetMaxPoints = (
  ruleSet: RoboostScoreRuleSet,
  isMultiValue: boolean,
) => {
  if (ruleSet.mode === 'fixed') {
    return ruleSet.action === 'add'
      ? roundRoboostScorePoints(Math.abs(ruleSet.points ?? 0))
      : 0;
  }
  const positives = ruleSet.valuePoints
    .map((valuePoint) =>
      getRoboostSignedPoints(valuePoint.action, valuePoint.points),
    )
    .filter((points) => points > 0);

  if (positives.length === 0) {
    return 0;
  }

  return roundRoboostScorePoints(
    isMultiValue
      ? positives.reduce((sum, points) => sum + points, 0)
      : Math.max(...positives),
  );
};

export const isRoboostScoreConditionComplete = (
  condition: RoboostScoreCondition,
) => {
  if (!isNonEmptyString(condition.fieldName) || condition.operand === null) {
    return false;
  }
  if (isRoboostValuelessFilterOperator(condition.operand)) {
    return true;
  }
  const values = (condition.value ?? []).filter(isNonEmptyString);

  return isRoboostTwoValueFilterOperator(condition.operand)
    ? values.length >= 2 && isNonEmptyString(condition.value?.[1])
    : values.length >= 1;
};

const isValidPoints = (points: number | null) =>
  points !== null && Number.isFinite(points) && points >= 0;

export type RoboostScoreValidation = {
  isValid: boolean;
  maxPossible: number;
  isMaxPossibleOverScoreMax: boolean;
  sumOfLimits: number;
  isSumOfLimitsOverScoreMax: boolean;
  groupMaxById: Record<string, number>;
  groupsOverLimit: string[];
  incompleteConditionIds: string[];
  incompleteRuleSetIds: string[];
  invalidPointsRuleSetIds: string[];
};

export const validateRoboostScoreCriteria = (
  criteria: RoboostScoreCriteria,
  isMultiValueField: (fieldName: string) => boolean = () => false,
): RoboostScoreValidation => {
  const groupMaxById: Record<string, number> = {};
  const groupsOverLimit: string[] = [];
  const incompleteConditionIds: string[] = [];
  const incompleteRuleSetIds: string[] = [];
  const invalidPointsRuleSetIds: string[] = [];
  let maxPossible = 0;
  let sumOfLimits = 0;

  for (const group of criteria.groups) {
    let groupMax = 0;

    for (const ruleSet of group.ruleSets) {
      const incomplete = ruleSet.conditions.filter(
        (condition) => !isRoboostScoreConditionComplete(condition),
      );

      incompleteConditionIds.push(...incomplete.map(({ id }) => id));
      if (ruleSet.conditions.length === 0 || incomplete.length > 0) {
        incompleteRuleSetIds.push(ruleSet.id);
      }
      const hasInvalidPoints =
        ruleSet.mode === 'fixed'
          ? !isValidPoints(ruleSet.points)
          : ruleSet.valuePoints.length === 0 ||
            ruleSet.valuePoints.some(({ points }) => !isValidPoints(points));

      if (hasInvalidPoints) {
        invalidPointsRuleSetIds.push(ruleSet.id);
      }
      const fieldName = ruleSet.conditions[0]?.fieldName;

      groupMax += getRoboostRuleSetMaxPoints(
        ruleSet,
        isNonEmptyString(fieldName) && isMultiValueField(fieldName),
      );
    }
    groupMax = roundRoboostScorePoints(groupMax);
    groupMaxById[group.id] = groupMax;
    const limit = group.limit !== null && group.limit > 0 ? group.limit : null;

    if (limit !== null) {
      sumOfLimits += limit;
      if (groupMax > limit) {
        groupsOverLimit.push(group.id);
      }
    }
    maxPossible += limit === null ? groupMax : Math.min(groupMax, limit);
  }
  maxPossible = roundRoboostScorePoints(maxPossible);
  sumOfLimits = roundRoboostScorePoints(sumOfLimits);
  const isSumOfLimitsOverScoreMax = sumOfLimits > criteria.scoreMax;

  return {
    isValid:
      groupsOverLimit.length === 0 &&
      !isSumOfLimitsOverScoreMax &&
      incompleteRuleSetIds.length === 0 &&
      invalidPointsRuleSetIds.length === 0 &&
      criteria.groups.every((group) => group.limit === null || group.limit > 0),
    maxPossible,
    isMaxPossibleOverScoreMax: maxPossible > criteria.scoreMax,
    sumOfLimits,
    isSumOfLimitsOverScoreMax,
    groupMaxById,
    groupsOverLimit,
    incompleteConditionIds,
    incompleteRuleSetIds,
    invalidPointsRuleSetIds,
  };
};
