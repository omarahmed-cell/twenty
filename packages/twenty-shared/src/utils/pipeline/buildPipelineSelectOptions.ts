import { TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER } from '@/application/constants/TwentyStandardApplicationUniversalIdentifier';
import { getSelectOptionUniversalIdentifier } from '@/application/deterministic-identifier/get-select-option-universal-identifier.util';
import { DEFAULT_SELECT_OPTION_COLOR } from '@/constants/DefaultSelectOptionColor';
import { isDefined } from '@/utils/validation/isDefined';

export type PipelineSelectSourceStage = {
  value: string;
  label: string;
  color: string | null;
};

export type PipelineSelectSource = {
  key: string;
  name: string;
  stages: PipelineSelectSourceStage[];
};

export type PipelineSelectOption = {
  id: string;
  value: string;
  label: string;
  position: number;
  color: string;
};

type ExistingSelectOption = Pick<PipelineSelectOption, 'id' | 'value'> &
  Partial<Pick<PipelineSelectOption, 'color'>>;

// Pipelines and stages arrive in Settings order; an existing option keeps its id so views and filters stay attached
export const buildPipelineSelectOptions = ({
  pipelines,
  pipelineFieldUniversalIdentifier,
  stageFieldUniversalIdentifier,
  existingPipelineOptions = [],
  existingStageOptions = [],
}: {
  pipelines: PipelineSelectSource[];
  pipelineFieldUniversalIdentifier: string;
  stageFieldUniversalIdentifier: string;
  existingPipelineOptions?: ExistingSelectOption[];
  existingStageOptions?: ExistingSelectOption[];
}) => {
  const existingPipelineOptionByValue = new Map(
    existingPipelineOptions.map((option) => [option.value, option]),
  );
  const existingStageOptionIdByValue = new Map(
    existingStageOptions.map((option) => [option.value, option.id]),
  );

  const optionId = (
    fieldUniversalIdentifier: string,
    value: string,
    existingId: string | undefined,
  ) =>
    existingId ??
    getSelectOptionUniversalIdentifier({
      applicationUniversalIdentifier:
        TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER,
      fieldUniversalIdentifier,
      value,
    });

  const pipelineOptions: PipelineSelectOption[] = pipelines.map(
    (pipeline, position) => {
      const existingOption = existingPipelineOptionByValue.get(pipeline.key);

      return {
        id: optionId(
          pipelineFieldUniversalIdentifier,
          pipeline.key,
          existingOption?.id,
        ),
        value: pipeline.key,
        label: pipeline.name,
        position,
        color: existingOption?.color ?? DEFAULT_SELECT_OPTION_COLOR,
      };
    },
  );

  const stageOptions: PipelineSelectOption[] = pipelines
    .flatMap((pipeline) => pipeline.stages)
    .map((stage, position) => ({
      id: optionId(
        stageFieldUniversalIdentifier,
        stage.value,
        existingStageOptionIdByValue.get(stage.value),
      ),
      value: stage.value,
      label: stage.label,
      position,
      color: stage.color ?? DEFAULT_SELECT_OPTION_COLOR,
    }));

  const firstPipeline = pipelines.find(
    (pipeline) => pipeline.stages.length > 0,
  );

  return {
    pipelineOptions,
    stageOptions,
    defaultPipelineValue: isDefined(firstPipeline) ? firstPipeline.key : null,
    defaultStageValue: firstPipeline?.stages[0]?.value ?? null,
  };
};
