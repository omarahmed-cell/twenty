import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { useDealStageEntry } from '@/pipeline/conditional-logic/hooks/useDealStageEntry';
import { DEAL_STAGE_FIELD_NAME } from '@/pipeline/stage-picker/utils/dealStageFields';
import { usePropertyLogicFieldChange } from '@/properties/hooks/usePropertyLogicFieldChange';
import { isString } from '@sniptt/guards';
import { isPipelineObjectNameSingular } from 'twenty-shared/utils';

// Before a change is written: asks for the fields that stage and property rules now require.
// Resolves with the full update input, or null when the user cancels.
export const useRoboostRequiredFieldsCheck = (
  objectMetadataItem: EnrichedObjectMetadataItem,
) => {
  const isPipelineObject = isPipelineObjectNameSingular(
    objectMetadataItem.nameSingular,
  );
  const { resolveStageEntry } = useDealStageEntry({
    enabled: isPipelineObject,
    objectNameSingular: isPipelineObject
      ? objectMetadataItem.nameSingular
      : undefined,
  });
  const { resolvePropertyLogicChange } =
    usePropertyLogicFieldChange(objectMetadataItem);

  const completeChange = async ({
    recordId,
    record,
    changes,
    pipelineKey,
  }: {
    recordId: string;
    record: Record<string, unknown>;
    changes: Record<string, unknown>;
    pipelineKey?: string;
  }): Promise<Record<string, unknown> | null> => {
    let input = changes;
    const targetStage = changes[DEAL_STAGE_FIELD_NAME];

    if (isPipelineObject && isString(targetStage)) {
      const stageDecision = await resolveStageEntry({
        recordId,
        fallbackRecord: record,
        targetStageValue: targetStage,
        targetPipelineKey: pipelineKey,
      });

      if (stageDecision.status === 'cancelled') {
        return null;
      }
      if (stageDecision.status === 'confirmed') {
        input = { ...input, ...stageDecision.values };
      }
    }

    const propertyDecision = await resolvePropertyLogicChange({
      recordId,
      fallbackRecord: record,
      changes: input,
    });

    if (propertyDecision.status === 'cancelled') {
      return null;
    }

    return propertyDecision.status === 'confirmed'
      ? { ...input, ...propertyDecision.values }
      : input;
  };

  return { completeChange };
};
