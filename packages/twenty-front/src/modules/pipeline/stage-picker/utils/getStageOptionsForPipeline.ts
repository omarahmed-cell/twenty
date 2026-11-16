import { type PipelineConfig } from '@/pipeline/types/PipelineConfig';
import { formatPipelineStageLabel, isDefined } from 'twenty-shared/utils';

type StageOption = { value: string; label: string };

// Options keep their metadata look; the pipeline config only decides which ones show and in what order
export const getStageOptionsForPipeline = <TOption extends StageOption>({
  options,
  pipelines,
  pipelineKey,
  currentStageValue,
}: {
  options: TOption[];
  pipelines: PipelineConfig[];
  pipelineKey: string | null | undefined;
  currentStageValue?: string | null;
}): TOption[] => {
  // Views that don't load the Pipeline column still know it from the stage, which belongs to one pipeline
  const pipeline =
    pipelines.find(({ key }) => key === pipelineKey) ??
    pipelines.find(({ stages }) =>
      stages.some(({ value }) => value === currentStageValue),
    );

  if (!isDefined(pipeline)) {
    return getStageOptionsWithPipelineLabels({ options, pipelines });
  }

  const optionByValue = new Map(
    options.map((option) => [option.value, option]),
  );

  return pipeline.stages
    .map((stage) => optionByValue.get(stage.value))
    .filter(isDefined);
};

// The full list, ordered by pipeline then stage, each label prefixed so same-named stages differ
export const getStageOptionsWithPipelineLabels = <TOption extends StageOption>({
  options,
  pipelines,
}: {
  options: TOption[];
  pipelines: PipelineConfig[];
}): TOption[] => {
  const optionByValue = new Map(
    options.map((option) => [option.value, option]),
  );
  const orderedValues = new Set<string>();

  const labelledOptions = pipelines.flatMap((pipeline) =>
    pipeline.stages.flatMap((stage) => {
      const option = optionByValue.get(stage.value);

      if (!isDefined(option)) {
        return [];
      }

      orderedValues.add(stage.value);

      return [
        {
          ...option,
          label: formatPipelineStageLabel({
            pipelineName: pipeline.name,
            stageLabel: option.label,
          }),
        },
      ];
    }),
  );

  return [
    ...labelledOptions,
    ...options.filter((option) => !orderedValues.has(option.value)),
  ];
};

export const getFirstStageValueOfPipeline = ({
  pipelines,
  pipelineKey,
}: {
  pipelines: PipelineConfig[];
  pipelineKey: string | null | undefined;
}): string | undefined =>
  pipelines.find(({ key }) => key === pipelineKey)?.stages[0]?.value;

export type SharedPipelineKeyResult =
  | { status: 'shared'; pipelineKey: string }
  | { status: 'mixed' }
  | { status: 'none' };

export const getSharedPipelineKey = (
  pipelineKeys: (string | null | undefined)[],
): SharedPipelineKeyResult => {
  const distinctKeys = [...new Set(pipelineKeys.filter(isDefined))];

  if (distinctKeys.length === 0) {
    return { status: 'none' };
  }

  if (distinctKeys.length > 1) {
    return { status: 'mixed' };
  }

  return { status: 'shared', pipelineKey: distinctKeys[0] };
};

// The pipeline goes right before the stage, so it is picked first
export const movePipelineFieldBeforeStageField = <
  TField extends { name: string },
>(
  fields: TField[],
): TField[] => {
  const pipelineField = fields.find(({ name }) => name === 'pipeline');
  const stageIndex = fields.findIndex(({ name }) => name === 'stage');

  if (!isDefined(pipelineField) || stageIndex === -1) {
    return fields;
  }

  const withoutPipeline = fields.filter((field) => field !== pipelineField);
  const stageIndexWithoutPipeline = withoutPipeline.findIndex(
    ({ name }) => name === 'stage',
  );

  return [
    ...withoutPipeline.slice(0, stageIndexWithoutPipeline),
    pipelineField,
    ...withoutPipeline.slice(stageIndexWithoutPipeline),
  ];
};
