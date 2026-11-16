import { isDefined } from 'twenty-shared/utils';

import { type PipelineConfig } from 'src/modules/pipeline/types/pipeline-config.type';

export type DealPipelineStageResolution =
  | { status: 'unchanged' }
  | { status: 'resolved'; pipeline: string; stage: string }
  | {
      status: 'refused';
      reason:
        | 'UNKNOWN_PIPELINE'
        | 'UNKNOWN_STAGE'
        | 'PIPELINE_WITHOUT_STAGES'
        | 'STAGE_NOT_IN_PIPELINE';
      pipelineName?: string;
      stageLabel?: string;
      value?: string;
    };

type DealPipelineStageValues = {
  pipeline?: string | null;
  stage?: string | null;
};

// A stage value belongs to exactly one pipeline, so it tells which pipeline a stage-only write means
export const resolveDealPipelineStage = ({
  pipelines,
  current,
  input,
}: {
  pipelines: PipelineConfig[];
  current?: DealPipelineStageValues;
  input: DealPipelineStageValues;
}): DealPipelineStageResolution => {
  const hasPipelineInput = input.pipeline !== undefined;
  const hasStageInput = input.stage !== undefined;
  const isCreate = !isDefined(current);

  if (pipelines.length === 0) {
    return { status: 'unchanged' };
  }

  if (!isCreate && !hasPipelineInput && !hasStageInput) {
    return { status: 'unchanged' };
  }

  const pipelineByKey = new Map(
    pipelines.map((pipeline) => [pipeline.key, pipeline]),
  );
  const pipelineByStageValue = new Map(
    pipelines.flatMap((pipeline) =>
      pipeline.stages.map((stage) => [stage.value, pipeline] as const),
    ),
  );

  const firstStageOf = (pipeline: PipelineConfig) => pipeline.stages[0];

  const resolveFromPipeline = (
    pipelineKey: string | null | undefined,
  ): DealPipelineStageResolution => {
    const pipeline = isDefined(pipelineKey)
      ? pipelineByKey.get(pipelineKey)
      : undefined;

    if (!isDefined(pipeline)) {
      return {
        status: 'refused',
        reason: 'UNKNOWN_PIPELINE',
        value: pipelineKey ?? undefined,
      };
    }

    const firstStage = firstStageOf(pipeline);

    if (!isDefined(firstStage)) {
      return {
        status: 'refused',
        reason: 'PIPELINE_WITHOUT_STAGES',
        pipelineName: pipeline.name,
      };
    }

    return {
      status: 'resolved',
      pipeline: pipeline.key,
      stage: firstStage.value,
    };
  };

  const checkStageInPipeline = (
    stageValue: string | null | undefined,
    pipelineKey: string | null | undefined,
  ): DealPipelineStageResolution => {
    const stagePipeline = isDefined(stageValue)
      ? pipelineByStageValue.get(stageValue)
      : undefined;

    if (!isDefined(stagePipeline) || !isDefined(stageValue)) {
      return {
        status: 'refused',
        reason: 'UNKNOWN_STAGE',
        value: stageValue ?? undefined,
      };
    }

    if (!isDefined(pipelineKey)) {
      return {
        status: 'resolved',
        pipeline: stagePipeline.key,
        stage: stageValue,
      };
    }

    const pipeline = pipelineByKey.get(pipelineKey);

    if (!isDefined(pipeline)) {
      return {
        status: 'refused',
        reason: 'UNKNOWN_PIPELINE',
        value: pipelineKey,
      };
    }

    if (stagePipeline.key !== pipeline.key) {
      return {
        status: 'refused',
        reason: 'STAGE_NOT_IN_PIPELINE',
        pipelineName: pipeline.name,
        stageLabel:
          stagePipeline.stages.find((stage) => stage.value === stageValue)
            ?.label ?? stageValue,
      };
    }

    return { status: 'resolved', pipeline: pipeline.key, stage: stageValue };
  };

  if (isCreate) {
    if (hasStageInput) {
      return checkStageInPipeline(
        input.stage,
        hasPipelineInput ? input.pipeline : undefined,
      );
    }

    return hasPipelineInput
      ? resolveFromPipeline(input.pipeline)
      : resolveFromPipeline(pipelines[0].key);
  }

  if (hasStageInput) {
    const currentPipelineKey =
      isDefined(current?.pipeline) && pipelineByKey.has(current.pipeline)
        ? current.pipeline
        : undefined;

    return checkStageInPipeline(
      input.stage,
      hasPipelineInput ? input.pipeline : currentPipelineKey,
    );
  }

  if (input.pipeline === current?.pipeline) {
    return { status: 'unchanged' };
  }

  return resolveFromPipeline(input.pipeline);
};
