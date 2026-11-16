import { isDealCreationStageAllowed, isDefined } from 'twenty-shared/utils';

import { getDealStageDisabledReason } from '@/pipeline/rules/utils/getDealStageDisabledReason';
import { type PipelineConfig } from '@/pipeline/types/PipelineConfig';

type StageOption = {
  value: string;
  disabled?: boolean;
  contextualText?: string;
};

// A stage belongs to one pipeline, so views without the Pipeline column still find it
export const findDealPipeline = ({
  pipelines,
  pipelineKey,
  stageValue,
}: {
  pipelines: PipelineConfig[];
  pipelineKey: string | null | undefined;
  stageValue: string | null | undefined;
}): PipelineConfig | undefined =>
  pipelines.find(({ key }) => key === pipelineKey) ??
  pipelines.find(({ stages }) =>
    stages.some(({ value }) => value === stageValue),
  );

export const applyDealStageRulesToOptions = <TOption extends StageOption>({
  options,
  pipeline,
  isAdmin,
  isCreate,
  currentStageValue,
}: {
  options: TOption[];
  pipeline: PipelineConfig | undefined;
  isAdmin: boolean;
  isCreate: boolean;
  currentStageValue: string | null | undefined;
}): TOption[] =>
  options.map((option) => {
    const disabledReason = getDealStageDisabledReason({
      pipeline,
      isAdmin,
      isCreate,
      currentStageValue,
      targetStageValue: option.value,
    });

    return isDefined(disabledReason)
      ? { ...option, disabled: true, contextualText: disabledReason }
      : option;
  });

export const getDealCreationStageFallback = ({
  pipeline,
  isAdmin,
  draftStageValue,
}: {
  pipeline: PipelineConfig | undefined;
  isAdmin: boolean;
  draftStageValue: string | null;
}): string | undefined => {
  if (isAdmin || !isDefined(pipeline)) {
    return undefined;
  }

  const isDraftStageAllowed =
    isDefined(draftStageValue) &&
    pipeline.stages.some(({ value }) => value === draftStageValue) &&
    isDealCreationStageAllowed({
      rules: pipeline.rules,
      stageValue: draftStageValue,
    });

  return isDraftStageAllowed
    ? undefined
    : getFirstAllowedCreationStageValue({ pipeline, isAdmin });
};

export const getFirstAllowedCreationStageValue = ({
  pipeline,
  isAdmin,
}: {
  pipeline: PipelineConfig | undefined;
  isAdmin: boolean;
}): string | undefined =>
  pipeline?.stages.find(
    ({ value }) =>
      isAdmin ||
      isDealCreationStageAllowed({ rules: pipeline.rules, stageValue: value }),
  )?.value;
