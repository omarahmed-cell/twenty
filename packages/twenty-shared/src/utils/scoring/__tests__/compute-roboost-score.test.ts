import {
  computeRoboostScoreBreakdown,
  validateRoboostScoreCriteria,
} from '@/utils/scoring/compute-roboost-score';
import { parseRoboostScoreCriteria } from '@/utils/scoring/parse-roboost-score-criteria';
import { type RoboostScoreCriteria } from '@/utils/scoring/roboost-score-criteria';

const condition = (id: string) => ({
  id,
  fieldName: 'stage',
  operand: 'isAnyOf' as const,
  value: ['A'],
});

const criteria: RoboostScoreCriteria = {
  scoreMin: -100,
  scoreMax: 100,
  groups: [
    {
      id: 'g1',
      name: 'Fit',
      limit: 12,
      collapsed: false,
      ruleSets: [
        {
          id: 'r1',
          conditions: [condition('c1')],
          mode: 'fixed',
          action: 'add',
          points: 10,
          valuePoints: [],
        },
        {
          id: 'r2',
          conditions: [condition('c2')],
          mode: 'fixed',
          action: 'add',
          points: 5,
          valuePoints: [],
        },
      ],
    },
    {
      id: 'g2',
      name: 'Stage',
      limit: null,
      collapsed: false,
      ruleSets: [
        {
          id: 'r3',
          conditions: [condition('c3')],
          mode: 'perValue',
          action: 'add',
          points: null,
          valuePoints: [
            { value: 'A', action: 'add', points: 17 },
            { value: 'B', action: 'subtract', points: 3.5 },
          ],
        },
        {
          id: 'r4',
          conditions: [condition('c4')],
          mode: 'fixed',
          action: 'subtract',
          points: 2,
          valuePoints: [],
        },
      ],
    },
  ],
};

describe('computeRoboostScoreBreakdown', () => {
  it('caps groups at their limit and sums true rule sets', () => {
    const breakdown = computeRoboostScoreBreakdown(criteria, {
      r1: { matched: true, matchedValues: [] },
      r2: { matched: true, matchedValues: [] },
      r3: { matched: true, matchedValues: ['B'] },
      r4: { matched: false, matchedValues: [] },
    });

    expect(breakdown.groups[0].raw).toBe(15);
    expect(breakdown.groups[0].applied).toBe(12);
    expect(breakdown.groups[1].applied).toBe(-3.5);
    expect(breakdown.total).toBe(8.5);
    expect(breakdown.matchedRuleSetCount).toBe(3);
    expect(breakdown.ruleSetCount).toBe(4);
  });

  it('clamps the total to the score limits', () => {
    const breakdown = computeRoboostScoreBreakdown(
      { ...criteria, scoreMin: 0, scoreMax: 100 },
      {
        r1: { matched: false, matchedValues: [] },
        r2: { matched: false, matchedValues: [] },
        r3: { matched: true, matchedValues: ['B'] },
        r4: { matched: true, matchedValues: [] },
      },
    );

    expect(breakdown.rawTotal).toBe(-5.5);
    expect(breakdown.total).toBe(0);
  });
});

describe('validateRoboostScoreCriteria', () => {
  it('flags a group whose maximum exceeds its limit', () => {
    const validation = validateRoboostScoreCriteria(criteria);

    expect(validation.groupMaxById).toEqual({ g1: 15, g2: 17 });
    expect(validation.groupsOverLimit).toEqual(['g1']);
    expect(validation.maxPossible).toBe(29);
    expect(validation.isValid).toBe(false);
  });

  it('sums positive per-value points for multi-select fields', () => {
    const validation = validateRoboostScoreCriteria(
      {
        ...criteria,
        groups: [
          {
            ...criteria.groups[1],
            ruleSets: [
              {
                ...criteria.groups[1].ruleSets[0],
                valuePoints: [
                  { value: 'A', action: 'add', points: 4 },
                  { value: 'B', action: 'add', points: 6 },
                ],
              },
            ],
          },
        ],
      },
      () => true,
    );

    expect(validation.maxPossible).toBe(10);
    expect(validation.isValid).toBe(true);
  });

  it('blocks incomplete conditions and limits over the score max', () => {
    const validation = validateRoboostScoreCriteria({
      scoreMin: 0,
      scoreMax: 10,
      groups: [
        { ...criteria.groups[0], limit: 20 },
        {
          ...criteria.groups[1],
          ruleSets: [
            {
              ...criteria.groups[1].ruleSets[1],
              conditions: [
                { id: 'x', fieldName: 'stage', operand: null, value: null },
              ],
            },
          ],
        },
      ],
    });

    expect(validation.isSumOfLimitsOverScoreMax).toBe(true);
    expect(validation.incompleteConditionIds).toEqual(['x']);
    expect(validation.isValid).toBe(false);
  });
});

describe('parseRoboostScoreCriteria', () => {
  it('keeps one decimal and drops unknown shapes', () => {
    const parsed = parseRoboostScoreCriteria({
      scoreMin: -200,
      scoreMax: 200,
      groups: [
        {
          id: 'g',
          name: 'G',
          limit: '0',
          ruleSets: [{ id: 'r', points: 2.26, conditions: 'nope' }],
        },
      ],
    });

    expect(parsed.scoreMax).toBe(200);
    expect(parsed.groups[0].limit).toBeNull();
    expect(parsed.groups[0].ruleSets[0].points).toBe(2.3);
    expect(parsed.groups[0].ruleSets[0].conditions).toEqual([]);
  });
});
