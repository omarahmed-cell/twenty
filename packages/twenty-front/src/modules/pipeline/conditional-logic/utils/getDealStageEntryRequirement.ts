import { isString } from '@sniptt/guards';
import {
  type ConditionalLogicField,
  type ConditionalLogicProperty,
  findMissingConditionalLogicProperties,
  isDefined,
  resolveConditionalLogicProperties,
} from 'twenty-shared/utils';

import {
  type PipelineConfig,
  type PipelineStageConfig,
} from '@/pipeline/types/PipelineConfig';
import {
  DEAL_PIPELINE_FIELD_NAME,
  DEAL_STAGE_FIELD_NAME,
} from '@/pipeline/stage-picker/utils/dealStageFields';

export type DealStageEntryRequirement = {
  pipeline: PipelineConfig;
  stage: PipelineStageConfig;
  properties: ConditionalLogicProperty[];
  missingRequiredFields: ConditionalLogicField[];
  isDialogNeeded: boolean;
};

const findTargetPipeline = ({
  pipelines,
  pipelineKey,
  stageValue,
}: {
  pipelines: PipelineConfig[];
  pipelineKey: string | null;
  stageValue: string;
}) => {
  const hasStage = (pipeline: PipelineConfig) =>
    pipeline.stages.some(({ value }) => value === stageValue);

  return (
    pipelines.find(
      (pipeline) => pipeline.key === pipelineKey && hasStage(pipeline),
    ) ?? pipelines.find(hasStage)
  );
};

// Mirrors the server: a stage's rules only apply when the deal enters it
export const getDealStageEntryRequirement = ({
  pipelines,
  record,
  targetStageValue,
  targetPipelineKey,
  fields,
}: {
  pipelines: PipelineConfig[];
  record: Record<string, unknown>;
  targetStageValue: string | null | undefined;
  targetPipelineKey?: string | null;
  fields: ConditionalLogicField[];
}): DealStageEntryRequirement | null => {
  if (!isString(targetStageValue)) {
    return null;
  }

  const currentPipelineKey = isString(record[DEAL_PIPELINE_FIELD_NAME])
    ? record[DEAL_PIPELINE_FIELD_NAME]
    : null;

  const pipeline = findTargetPipeline({
    pipelines,
    pipelineKey: targetPipelineKey ?? currentPipelineKey,
    stageValue: targetStageValue,
  });

  const stage = pipeline?.stages.find(
    ({ value }) => value === targetStageValue,
  );

  if (!isDefined(pipeline) || !isDefined(stage)) {
    return null;
  }

  const isEnteringStage =
    record[DEAL_STAGE_FIELD_NAME] !== targetStageValue ||
    currentPipelineKey !== pipeline.key;

  if (!isEnteringStage || stage.conditionalRules.length === 0) {
    return null;
  }

  const resultingRecord = {
    ...record,
    [DEAL_STAGE_FIELD_NAME]: targetStageValue,
    [DEAL_PIPELINE_FIELD_NAME]: pipeline.key,
  };

  const properties = resolveConditionalLogicProperties({
    rules: stage.conditionalRules,
    record: resultingRecord,
    fields,
  });

  if (properties.length === 0) {
    return null;
  }

  const missingRequiredFields = findMissingConditionalLogicProperties({
    rules: stage.conditionalRules,
    record: resultingRecord,
    fields,
  });

  return {
    pipeline,
    stage,
    properties,
    missingRequiredFields,
    isDialogNeeded:
      missingRequiredFields.length > 0 ||
      properties.some(({ isRequired }) => !isRequired),
  };
};
