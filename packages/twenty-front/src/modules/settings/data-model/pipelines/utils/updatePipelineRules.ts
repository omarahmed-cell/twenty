import { type PipelineRules } from 'twenty-shared/utils';

export type PipelineStageListRuleKey =
  | 'limitCreationToStages'
  | 'lockEditingInStages';

export type PipelineBooleanRuleKey = 'restrictSkipping' | 'restrictBackward';

export const setPipelineRuleEnabled = ({
  rules,
  ruleKey,
  enabled,
}: {
  rules: PipelineRules;
  ruleKey: PipelineStageListRuleKey | PipelineBooleanRuleKey;
  enabled: boolean;
}): PipelineRules =>
  ruleKey === 'restrictSkipping' || ruleKey === 'restrictBackward'
    ? { ...rules, [ruleKey]: enabled }
    : { ...rules, [ruleKey]: { ...rules[ruleKey], enabled } };

export const togglePipelineRuleStage = ({
  rules,
  ruleKey,
  stageValue,
}: {
  rules: PipelineRules;
  ruleKey: PipelineStageListRuleKey;
  stageValue: string;
}): PipelineRules => {
  const { stageValues } = rules[ruleKey];

  return {
    ...rules,
    [ruleKey]: {
      ...rules[ruleKey],
      stageValues: stageValues.includes(stageValue)
        ? stageValues.filter((value) => value !== stageValue)
        : [...stageValues, stageValue],
    },
  };
};

// A rule may still name a stage that was deleted since; only live stages count
export const keepExistingRuleStages = ({
  rules,
  stageValues,
}: {
  rules: PipelineRules;
  stageValues: string[];
}): PipelineRules => ({
  ...rules,
  limitCreationToStages: {
    ...rules.limitCreationToStages,
    stageValues: rules.limitCreationToStages.stageValues.filter((value) =>
      stageValues.includes(value),
    ),
  },
  lockEditingInStages: {
    ...rules.lockEditingInStages,
    stageValues: rules.lockEditingInStages.stageValues.filter((value) =>
      stageValues.includes(value),
    ),
  },
});
