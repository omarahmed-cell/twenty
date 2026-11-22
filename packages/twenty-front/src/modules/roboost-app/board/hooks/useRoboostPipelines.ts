import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { useObjectMetadataItems } from '@/object-metadata/hooks/useObjectMetadataItems';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { isDefined } from 'twenty-shared/utils';

export type RoboostPipelineStage = {
  value: string;
  label: string;
  color: string | null;
  probability: number | null;
  position: number;
};

export type RoboostPipeline = {
  key: string;
  name: string;
  stages: RoboostPipelineStage[];
};

type PipelineRecord = ObjectRecord & {
  key: string;
  name: string;
  position: number;
  stages?: (ObjectRecord & RoboostPipelineStage)[];
};

// Pipelines come from the pipeline object; without it, stages fall back to the stage field's options
export const useRoboostPipelines = (
  objectMetadataItem: EnrichedObjectMetadataItem,
) => {
  const { objectMetadataItems } = useObjectMetadataItems();
  const hasPipelineObject = objectMetadataItems.some(
    (item) => item.nameSingular === 'pipeline' && item.isActive,
  );

  const { records, loading } = useFindManyRecords<PipelineRecord>({
    objectNameSingular: hasPipelineObject
      ? 'pipeline'
      : objectMetadataItem.nameSingular,
    filter: { objectNameSingular: { eq: objectMetadataItem.nameSingular } },
    skip: !hasPipelineObject,
    orderBy: [{ position: 'AscNullsLast' }],
    recordGqlFields: {
      id: true,
      key: true,
      name: true,
      position: true,
      stages: {
        id: true,
        value: true,
        label: true,
        color: true,
        probability: true,
        position: true,
      },
    },
  });

  const stageField = objectMetadataItem.fields.find(
    (field) => field.name === 'stage' && field.isActive,
  );
  const stageOptions = [...(stageField?.options ?? [])].sort(
    (first, second) => first.position - second.position,
  );
  const stageLabelByValue = new Map(
    stageOptions.map((option) => [option.value, option.label]),
  );

  if (hasPipelineObject && records.length > 0) {
    const pipelines: RoboostPipeline[] = records.map((record) => ({
      key: record.key,
      name: record.name,
      stages: [...(record.stages ?? [])]
        .sort((first, second) => first.position - second.position)
        .map((stage) => ({
          value: stage.value,
          label: stageLabelByValue.get(stage.value) ?? stage.label,
          color: stage.color,
          probability: stage.probability,
          position: stage.position,
        })),
    }));

    return { pipelines, loading };
  }

  const pipelineField = objectMetadataItem.fields.find(
    (field) => field.name === 'pipeline' && field.isActive,
  );
  const pipelineOptions = pipelineField?.options ?? [];
  const pipelines: RoboostPipeline[] =
    pipelineOptions.length > 0
      ? pipelineOptions.map((option) => {
          const prefix = `${option.value.replace(/_PIPELINE$/, '')}_`;

          return {
            key: option.value,
            name: option.label,
            stages: stageOptions
              .filter((stage) => stage.value.startsWith(prefix))
              .map((stage) => ({
                value: stage.value,
                label: stage.label,
                color: stage.color ?? null,
                probability: null,
                position: stage.position,
              })),
          };
        })
      : isDefined(stageField)
        ? [
            {
              key: '',
              name: stageField.label,
              stages: stageOptions.map((stage) => ({
                value: stage.value,
                label: stage.label,
                color: stage.color ?? null,
                probability: null,
                position: stage.position,
              })),
            },
          ]
        : [];

  return { pipelines, loading };
};
