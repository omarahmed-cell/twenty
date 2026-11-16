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
};

export type PipelineConfig = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  position: number;
  objectNameSingular: string;
  rules: PipelineRules;
  stages: PipelineStageConfig[];
};
