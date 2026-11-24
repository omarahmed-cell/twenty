import { type RoboostFilterOperator } from '@/utils/roboost-filter/roboost-filter-operator';

export type RoboostScoreObjectName = 'person' | 'company' | 'opportunity';

export const ROBOOST_SCORE_OBJECT_NAMES: RoboostScoreObjectName[] = [
  'person',
  'company',
  'opportunity',
];

export type RoboostScoreAction = 'add' | 'subtract';

export type RoboostScoreCondition = {
  id: string;
  fieldName: string | null;
  operand: RoboostFilterOperator | null;
  value: string[] | null;
  // Display names for record ids (owners), so the editor never has to look them up again
  labels?: Record<string, string>;
};

export type RoboostScoreValuePoints = {
  value: string;
  action: RoboostScoreAction;
  points: number | null;
};

export type RoboostScoreRuleSet = {
  id: string;
  conditions: RoboostScoreCondition[];
  mode: 'fixed' | 'perValue';
  action: RoboostScoreAction;
  points: number | null;
  valuePoints: RoboostScoreValuePoints[];
  collapsed?: boolean;
};

export type RoboostScoreGroup = {
  id: string;
  name: string;
  limit: number | null;
  collapsed: boolean;
  ruleSets: RoboostScoreRuleSet[];
};

export type RoboostScoreCriteria = {
  scoreMin: number;
  scoreMax: number;
  groups: RoboostScoreGroup[];
};

export const ROBOOST_SCORE_LIMIT_OPTIONS: { min: number; max: number }[] = [
  { min: -100, max: 100 },
  { min: -200, max: 200 },
  { min: -300, max: 300 },
  { min: -400, max: 400 },
  { min: -500, max: 500 },
  { min: -1000, max: 1000 },
  { min: 0, max: 100 },
];

export const roundRoboostScorePoints = (value: number) =>
  Math.round(value * 10) / 10;

export const getRoboostSignedPoints = (
  action: RoboostScoreAction,
  points: number | null,
) => {
  const magnitude = roundRoboostScorePoints(Math.abs(points ?? 0));

  return action === 'subtract' ? -magnitude : magnitude;
};

export const createRoboostScoreId = () =>
  `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

export const createEmptyRoboostScoreRuleSet = (): RoboostScoreRuleSet => ({
  id: createRoboostScoreId(),
  conditions: [
    { id: createRoboostScoreId(), fieldName: null, operand: null, value: null },
  ],
  mode: 'fixed',
  action: 'add',
  points: 1,
  valuePoints: [],
});

export const createEmptyRoboostScoreGroup = (
  name: string,
): RoboostScoreGroup => ({
  id: createRoboostScoreId(),
  name,
  limit: null,
  collapsed: false,
  ruleSets: [],
});

export const createDefaultRoboostScoreCriteria = (
  groupName: string,
): RoboostScoreCriteria => ({
  scoreMin: -100,
  scoreMax: 100,
  groups: [createEmptyRoboostScoreGroup(groupName)],
});
