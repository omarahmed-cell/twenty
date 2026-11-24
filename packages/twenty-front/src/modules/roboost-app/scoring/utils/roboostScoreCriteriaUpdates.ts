import {
  createEmptyRoboostScoreGroup,
  createEmptyRoboostScoreRuleSet,
  createRoboostScoreId,
  type RoboostScoreCriteria,
  type RoboostScoreGroup,
  type RoboostScoreRuleSet,
} from 'twenty-shared/utils';

const moveItem = <TItem>(items: TItem[], from: number, to: number) => {
  if (from === to || from < 0 || to < 0 || from >= items.length) {
    return items;
  }
  const next = [...items];
  const [moved] = next.splice(from, 1);

  next.splice(Math.min(to, next.length), 0, moved);

  return next;
};

const withNewIds = (ruleSet: RoboostScoreRuleSet): RoboostScoreRuleSet => ({
  ...ruleSet,
  id: createRoboostScoreId(),
  conditions: ruleSet.conditions.map((condition) => ({
    ...condition,
    id: createRoboostScoreId(),
  })),
});

export const updateRoboostScoreGroup = (
  criteria: RoboostScoreCriteria,
  groupId: string,
  update: (group: RoboostScoreGroup) => RoboostScoreGroup,
): RoboostScoreCriteria => ({
  ...criteria,
  groups: criteria.groups.map((group) =>
    group.id === groupId ? update(group) : group,
  ),
});

export const updateRoboostScoreRuleSet = (
  criteria: RoboostScoreCriteria,
  groupId: string,
  ruleSetId: string,
  update: (ruleSet: RoboostScoreRuleSet) => RoboostScoreRuleSet,
) =>
  updateRoboostScoreGroup(criteria, groupId, (group) => ({
    ...group,
    ruleSets: group.ruleSets.map((ruleSet) =>
      ruleSet.id === ruleSetId ? update(ruleSet) : ruleSet,
    ),
  }));

export const addRoboostScoreGroup = (
  criteria: RoboostScoreCriteria,
  name: string,
): RoboostScoreCriteria => ({
  ...criteria,
  groups: [...criteria.groups, createEmptyRoboostScoreGroup(name)],
});

export const cloneRoboostScoreGroup = (
  criteria: RoboostScoreCriteria,
  groupId: string,
  copyName: (name: string) => string,
): RoboostScoreCriteria => {
  const index = criteria.groups.findIndex((group) => group.id === groupId);
  const source = criteria.groups[index];

  if (source === undefined) {
    return criteria;
  }
  const groups = [...criteria.groups];

  groups.splice(index + 1, 0, {
    ...source,
    id: createRoboostScoreId(),
    name: copyName(source.name),
    ruleSets: source.ruleSets.map(withNewIds),
  });

  return { ...criteria, groups };
};

export const deleteRoboostScoreGroup = (
  criteria: RoboostScoreCriteria,
  groupId: string,
): RoboostScoreCriteria => ({
  ...criteria,
  groups: criteria.groups.filter((group) => group.id !== groupId),
});

export const moveRoboostScoreGroup = (
  criteria: RoboostScoreCriteria,
  groupId: string,
  targetGroupId: string,
): RoboostScoreCriteria => ({
  ...criteria,
  groups: moveItem(
    criteria.groups,
    criteria.groups.findIndex((group) => group.id === groupId),
    criteria.groups.findIndex((group) => group.id === targetGroupId),
  ),
});

export const addRoboostScoreRuleSet = (
  criteria: RoboostScoreCriteria,
  groupId: string,
) =>
  updateRoboostScoreGroup(criteria, groupId, (group) => ({
    ...group,
    collapsed: false,
    ruleSets: [...group.ruleSets, createEmptyRoboostScoreRuleSet()],
  }));

export const duplicateRoboostScoreRuleSet = (
  criteria: RoboostScoreCriteria,
  groupId: string,
  ruleSetId: string,
) =>
  updateRoboostScoreGroup(criteria, groupId, (group) => {
    const index = group.ruleSets.findIndex(({ id }) => id === ruleSetId);
    const source = group.ruleSets[index];

    if (source === undefined) {
      return group;
    }
    const ruleSets = [...group.ruleSets];

    ruleSets.splice(index + 1, 0, withNewIds(source));

    return { ...group, ruleSets };
  });

export const deleteRoboostScoreRuleSet = (
  criteria: RoboostScoreCriteria,
  groupId: string,
  ruleSetId: string,
) =>
  updateRoboostScoreGroup(criteria, groupId, (group) => ({
    ...group,
    ruleSets: group.ruleSets.filter(({ id }) => id !== ruleSetId),
  }));

// Rule sets move inside a group or into another one, before the rule set they are dropped on
export const moveRoboostScoreRuleSet = (
  criteria: RoboostScoreCriteria,
  {
    fromGroupId,
    ruleSetId,
    toGroupId,
    beforeRuleSetId,
  }: {
    fromGroupId: string;
    ruleSetId: string;
    toGroupId: string;
    beforeRuleSetId: string | null;
  },
): RoboostScoreCriteria => {
  const moved = criteria.groups
    .find((group) => group.id === fromGroupId)
    ?.ruleSets.find(({ id }) => id === ruleSetId);

  if (moved === undefined || moved.id === beforeRuleSetId) {
    return criteria;
  }

  return {
    ...criteria,
    groups: criteria.groups.map((group) => {
      let ruleSets = group.ruleSets.filter(({ id }) => id !== ruleSetId);

      if (group.id === toGroupId) {
        const index =
          beforeRuleSetId === null
            ? ruleSets.length
            : ruleSets.findIndex(({ id }) => id === beforeRuleSetId);

        ruleSets = [...ruleSets];
        ruleSets.splice(index < 0 ? ruleSets.length : index, 0, moved);
      }

      return group.ruleSets === ruleSets ? group : { ...group, ruleSets };
    }),
  };
};

// Per-value points follow the values chosen in the condition; points already typed are kept
export const syncRoboostScoreValuePoints = (
  ruleSet: RoboostScoreRuleSet,
  values: string[],
): RoboostScoreRuleSet => ({
  ...ruleSet,
  valuePoints: values.map(
    (value) =>
      ruleSet.valuePoints.find((valuePoint) => valuePoint.value === value) ?? {
        value,
        action: ruleSet.action,
        points: ruleSet.points,
      },
  ),
});

export const setAllRoboostScoreCollapsed = (
  criteria: RoboostScoreCriteria,
  collapsed: boolean,
): RoboostScoreCriteria => ({
  ...criteria,
  groups: criteria.groups.map((group) => ({
    ...group,
    collapsed,
    ruleSets: group.ruleSets.map((ruleSet) => ({ ...ruleSet, collapsed })),
  })),
});
