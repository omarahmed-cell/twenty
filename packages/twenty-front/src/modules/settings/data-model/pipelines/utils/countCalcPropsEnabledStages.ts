import { type PipelineStageConfig } from '@/pipeline/types/PipelineConfig';

export const countCalcPropsEnabledStages = (stages: PipelineStageConfig[]) =>
  stages.filter((stage) => stage.calcPropsEnabled).length;
