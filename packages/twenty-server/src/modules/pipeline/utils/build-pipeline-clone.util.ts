import {
  buildPipelineKey,
  buildPipelineStageValue,
  PIPELINE_COPY_SUFFIX,
  type PipelineRules,
  type StageCalculatedPropertyKind,
} from 'twenty-shared/utils';

import { type PipelineConfig } from 'src/modules/pipeline/types/pipeline-config.type';

export type PipelineClone = {
  pipeline: {
    name: string;
    description: string | null;
    key: string;
    objectNameSingular: string;
    position: number;
    rules: PipelineRules;
    stageCalculatedPropertyKinds?: StageCalculatedPropertyKind[];
  };
  stages: {
    label: string;
    value: string;
    position: number;
    color: string | null;
    probability: number | null;
    calcPropsEnabled: boolean;
    conditionalRules: unknown;
  }[];
};

// A clone gets fresh keys everywhere, and its rules point at its own stages
export const buildPipelineClone = ({
  source,
  takenPipelineKeys,
  takenStageValues,
  position,
}: {
  source: PipelineConfig;
  takenPipelineKeys: string[];
  takenStageValues: string[];
  position: number;
}): PipelineClone => {
  const name = `${source.name}${PIPELINE_COPY_SUFFIX}`;
  const key = buildPipelineKey(name, takenPipelineKeys);
  const stageValues = [...takenStageValues];
  const newValueByOldValue = new Map<string, string>();

  const stages = source.stages.map((stage) => {
    const value = buildPipelineStageValue({
      pipelineKey: key,
      label: stage.label,
      existingValues: stageValues,
    });

    stageValues.push(value);
    newValueByOldValue.set(stage.value, value);

    return {
      label: stage.label,
      value,
      position: stage.position,
      color: stage.color,
      probability: stage.probability,
      calcPropsEnabled: stage.calcPropsEnabled,
      conditionalRules: stage.conditionalRules ?? [],
    };
  });

  const remap = (values: string[]) =>
    values
      .map((value) => newValueByOldValue.get(value))
      .filter((value): value is string => value !== undefined);

  return {
    pipeline: {
      name,
      description: source.description,
      key,
      objectNameSingular: source.objectNameSingular,
      position,
      ...(source.stageCalculatedPropertyKinds !== undefined
        ? {
            stageCalculatedPropertyKinds: [
              ...source.stageCalculatedPropertyKinds,
            ],
          }
        : {}),
      rules: {
        limitCreationToStages: {
          enabled: source.rules.limitCreationToStages.enabled,
          stageValues: remap(source.rules.limitCreationToStages.stageValues),
        },
        restrictSkipping: source.rules.restrictSkipping,
        restrictBackward: source.rules.restrictBackward,
        lockEditingInStages: {
          enabled: source.rules.lockEditingInStages.enabled,
          stageValues: remap(source.rules.lockEditingInStages.stageValues),
        },
      },
    },
    stages,
  };
};
