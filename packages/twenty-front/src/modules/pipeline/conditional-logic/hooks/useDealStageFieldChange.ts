import { isString } from '@sniptt/guards';
import { useStore } from 'jotai';
import { CoreObjectNameSingular } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

import { useUpdateOneRecord } from '@/object-record/hooks/useUpdateOneRecord';
import { recordStoreFamilyState } from '@/object-record/record-store/states/recordStoreFamilyState';
import { useDealStageEntry } from '@/pipeline/conditional-logic/hooks/useDealStageEntry';
import {
  DEAL_PIPELINE_FIELD_NAME,
  DEAL_STAGE_FIELD_NAME,
} from '@/pipeline/stage-picker/utils/dealStageFields';
import { getFirstStageValueOfPipeline } from '@/pipeline/stage-picker/utils/getStageOptionsForPipeline';

// A pipeline change puts the deal in the new pipeline's first stage, so it is checked as entering that stage
export const useDealStageFieldChange = ({
  recordId,
  isDealStage,
  isDealPipeline,
}: {
  recordId: string;
  isDealStage: boolean;
  isDealPipeline: boolean;
}) => {
  const store = useStore();
  const isEnabled = isDealStage || isDealPipeline;
  const { pipelines, hasStageRules, resolveStageEntry } = useDealStageEntry({
    enabled: isEnabled,
  });
  const { updateOneRecord } = useUpdateOneRecord();

  const getTarget = (newValue: string) =>
    isDealStage
      ? { targetStageValue: newValue }
      : {
          targetStageValue: getFirstStageValueOfPipeline({
            pipelines,
            pipelineKey: newValue,
          }),
          targetPipelineKey: newValue,
        };

  const isHandledByStageEntry = (newValue: unknown): newValue is string =>
    isEnabled &&
    isString(newValue) &&
    hasStageRules(getTarget(newValue).targetStageValue);

  // Saves the change together with the values the stage's rules ask for, or nothing when the user cancels
  const saveWithStageEntry = async (newValue: string) => {
    const target = getTarget(newValue);
    const decision = await resolveStageEntry({
      recordId,
      fallbackRecord:
        store.get(recordStoreFamilyState.atomFamily(recordId)) ?? {},
      ...target,
    });

    if (decision.status === 'cancelled') {
      return;
    }

    await updateOneRecord({
      objectNameSingular: CoreObjectNameSingular.Opportunity,
      idToUpdate: recordId,
      updateOneRecordInput: {
        ...(isDealStage
          ? { [DEAL_STAGE_FIELD_NAME]: newValue }
          : {
              [DEAL_PIPELINE_FIELD_NAME]: newValue,
              ...(isDefined(target.targetStageValue)
                ? { [DEAL_STAGE_FIELD_NAME]: target.targetStageValue }
                : {}),
            }),
        ...(decision.status === 'confirmed' ? decision.values : {}),
      },
    });
  };

  return { isHandledByStageEntry, saveWithStageEntry };
};
