import { isString } from '@sniptt/guards';
import { isDefined, isPipelineObjectNameSingular } from 'twenty-shared/utils';

import { isUpdateRecordValueEmpty } from '@/object-record/record-update-multiple/utils/isUpdateRecordValueEmpty';
import { useDealStageEntry } from '@/pipeline/conditional-logic/hooks/useDealStageEntry';
import { getDealBulkEditStageEntryRefusal } from '@/pipeline/conditional-logic/utils/getDealBulkStageEntryRefusal';
import {
  DEAL_PIPELINE_FIELD_NAME,
  DEAL_STAGE_FIELD_NAME,
} from '@/pipeline/stage-picker/utils/dealStageFields';
import { getFirstStageValueOfPipeline } from '@/pipeline/stage-picker/utils/getStageOptionsForPipeline';

export const useDealBulkEditStageEntryRefusal = ({
  objectNameSingular,
}: {
  objectNameSingular: string;
}) => {
  const isDealObject = isPipelineObjectNameSingular(objectNameSingular);
  const { pipelines, fields } = useDealStageEntry({
    enabled: isDealObject,
    objectNameSingular,
  });

  const getBulkEditStageEntryRefusal = (
    fieldUpdates: Record<string, unknown>,
  ): string | null => {
    if (!isDealObject) {
      return null;
    }

    const pipelineKey = fieldUpdates[DEAL_PIPELINE_FIELD_NAME];
    const stageValue = isString(fieldUpdates[DEAL_STAGE_FIELD_NAME])
      ? fieldUpdates[DEAL_STAGE_FIELD_NAME]
      : isString(pipelineKey)
        ? getFirstStageValueOfPipeline({ pipelines, pipelineKey })
        : undefined;

    if (!isDefined(stageValue)) {
      return null;
    }

    const stage = pipelines
      .filter(({ key }) => !isString(pipelineKey) || key === pipelineKey)
      .flatMap(({ stages }) => stages)
      .find(({ value }) => value === stageValue);

    return getDealBulkEditStageEntryRefusal({
      stage,
      isDealPipeline: objectNameSingular === 'opportunity',
      fields,
      providedFieldNames: Object.entries(fieldUpdates)
        .filter(([, value]) => !isUpdateRecordValueEmpty(value))
        .map(([fieldName]) => fieldName),
    });
  };

  return { getBulkEditStageEntryRefusal };
};
