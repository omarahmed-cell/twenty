import { type PipelineRules } from 'twenty-shared/utils';

export type PipelineStageConfig = {
  id: string;
  pipelineId: string;
  label: string;
  value: string;
  position: number;
  color: string | null;
  probability: number | null;
  hubspotStageId: string | null;
  calcPropsEnabled: boolean;
  conditionalRules: unknown;
};

export type PipelineConfig = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  position: number;
  objectNameSingular: string;
  hubspotPipelineId: string | null;
  rules: PipelineRules;
  stages: PipelineStageConfig[];
};
