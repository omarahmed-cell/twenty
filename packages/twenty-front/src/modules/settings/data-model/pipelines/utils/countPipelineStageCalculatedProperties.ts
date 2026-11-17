import { type PipelineConfig } from '@/pipeline/types/PipelineConfig';

export const countPipelineStageCalculatedProperties = ({
  stages,
  stageCalculatedPropertyKinds,
}: Pick<PipelineConfig, 'stages' | 'stageCalculatedPropertyKinds'>) =>
  stages.filter(({ calcPropsEnabled }) => calcPropsEnabled).length *
  stageCalculatedPropertyKinds.length;
