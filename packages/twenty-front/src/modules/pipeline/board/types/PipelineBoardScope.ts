// The pipeline a deals board is narrowed to: its key and its stage values in Settings order
import { type PipelineConfig } from '@/pipeline/types/PipelineConfig';

export type PipelineBoardScope = {
  pipelineKey: string;
  stageValues: string[];
  pipeline: PipelineConfig;
};
