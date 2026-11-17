import {
  STAGE_CALCULATED_PROPERTY_KINDS,
  type StageCalculatedPropertyKind,
} from '@/utils/pipeline/stage-calculated-properties';

export type PipelineObjectNameSingular = 'opportunity' | 'service';

export type PipelineObjectDefinition = {
  objectNameSingular: PipelineObjectNameSingular;
  stageHistoryObjectNameSingular: string;
  stageHistoryRecordFieldName: string;
  timelineActivityTargetFieldName: string;
  hasStageProbability: boolean;
  hasCloseDateAutomation: boolean;
  hasCalculatedDealFields: boolean;
};

// Deals carry amounts and probabilities; services only move through stages
export const PIPELINE_OBJECT_DEFINITIONS: Record<
  PipelineObjectNameSingular,
  PipelineObjectDefinition
> = {
  opportunity: {
    objectNameSingular: 'opportunity',
    stageHistoryObjectNameSingular: 'opportunityStageHistory',
    stageHistoryRecordFieldName: 'opportunity',
    timelineActivityTargetFieldName: 'targetOpportunity',
    hasStageProbability: true,
    hasCloseDateAutomation: true,
    hasCalculatedDealFields: true,
  },
  service: {
    objectNameSingular: 'service',
    stageHistoryObjectNameSingular: 'serviceStageHistory',
    stageHistoryRecordFieldName: 'service',
    timelineActivityTargetFieldName: 'targetService',
    hasStageProbability: false,
    hasCloseDateAutomation: false,
    hasCalculatedDealFields: false,
  },
};

export const PIPELINE_OBJECT_NAMES = Object.keys(
  PIPELINE_OBJECT_DEFINITIONS,
) as PipelineObjectNameSingular[];

export const isPipelineObjectNameSingular = (
  objectNameSingular: string | null | undefined,
): objectNameSingular is PipelineObjectNameSingular =>
  typeof objectNameSingular === 'string' &&
  objectNameSingular in PIPELINE_OBJECT_DEFINITIONS;

// Pipelines saved before the setting existed generate every kind
export const normalizeStageCalculatedPropertyKinds = (
  kinds: unknown,
): StageCalculatedPropertyKind[] => {
  if (!Array.isArray(kinds)) {
    return [...STAGE_CALCULATED_PROPERTY_KINDS];
  }

  return STAGE_CALCULATED_PROPERTY_KINDS.filter((kind) =>
    kinds.includes(kind),
  );
};
