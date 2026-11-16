import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import {
  type PipelineConfig,
  type PipelineStageConfig,
} from '@/pipeline/types/PipelineConfig';
import { isDefined, normalizePipelineRules } from 'twenty-shared/utils';

const byPosition = (
  first: { position: number },
  second: { position: number },
) => first.position - second.position;

export const buildPipelineConfigs = ({
  pipelineRecords,
  pipelineStageRecords,
}: {
  pipelineRecords: ObjectRecord[];
  pipelineStageRecords: ObjectRecord[];
}): PipelineConfig[] => {
  const stages: PipelineStageConfig[] = pipelineStageRecords
    .filter((record) => !isDefined(record.deletedAt))
    .map((record) => ({
      id: record.id,
      pipelineId: record.pipelineId,
      label: record.label ?? '',
      value: record.value,
      position: record.position ?? 0,
      color: record.color ?? null,
      probability: record.probability ?? null,
      hubspotStageId: record.hubspotStageId ?? null,
      calcPropsEnabled: record.calcPropsEnabled === true,
    }));

  return pipelineRecords
    .filter((record) => !isDefined(record.deletedAt))
    .map((record) => ({
      id: record.id,
      key: record.key,
      name: record.name ?? '',
      description: record.description ?? null,
      position: record.position ?? 0,
      objectNameSingular: record.objectNameSingular ?? 'opportunity',
      rules: normalizePipelineRules(record.rules),
      stages: stages
        .filter((stage) => stage.pipelineId === record.id)
        .sort(byPosition),
    }))
    .sort(byPosition);
};
