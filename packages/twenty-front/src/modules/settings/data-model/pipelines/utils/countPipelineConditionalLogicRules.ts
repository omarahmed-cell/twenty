import { type PipelineStageConfig } from '@/pipeline/types/PipelineConfig';

export const countPipelineConditionalLogicRules = (
  stages: Pick<PipelineStageConfig, 'conditionalRules'>[],
) => stages.reduce((total, stage) => total + stage.conditionalRules.length, 0);
