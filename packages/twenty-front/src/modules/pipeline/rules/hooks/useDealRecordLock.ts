import { t } from '@lingui/core/macro';
import { isString } from '@sniptt/guards';

import { recordStoreFamilySelector } from '@/object-record/record-store/states/selectors/recordStoreFamilySelector';
import { useIsPipelineAdmin } from '@/pipeline/rules/hooks/useIsPipelineAdmin';
import { findDealPipeline } from '@/pipeline/rules/utils/applyDealStageRules';
import { isDealLockedForViewer } from '@/pipeline/rules/utils/getDealStageDisabledReason';
import { useDealStagePipelineConfigs } from '@/pipeline/stage-picker/hooks/useDealStagePipelineConfigs';
import {
  DEAL_PIPELINE_FIELD_NAME,
  DEAL_STAGE_FIELD_NAME,
} from '@/pipeline/stage-picker/utils/dealStageFields';
import { useAtomFamilySelectorValue } from '@/ui/utilities/state/jotai/hooks/useAtomFamilySelectorValue';
import { CoreObjectNameSingular } from 'twenty-shared/types';

// A deal in a locked stage is read-only for everyone but Admins; activities on it stay open
export const useDealRecordLock = ({
  objectNameSingular,
  recordId,
}: {
  objectNameSingular: string | undefined;
  recordId: string;
}): { isLocked: boolean; lockReason: string | null } => {
  const isDeal = objectNameSingular === CoreObjectNameSingular.Opportunity;

  const isAdmin = useIsPipelineAdmin({ skip: !isDeal });
  const pipelines = useDealStagePipelineConfigs({ enabled: isDeal });

  const stageValue = useAtomFamilySelectorValue(recordStoreFamilySelector, {
    recordId,
    fieldName: DEAL_STAGE_FIELD_NAME,
  });
  const pipelineKey = useAtomFamilySelectorValue(recordStoreFamilySelector, {
    recordId,
    fieldName: DEAL_PIPELINE_FIELD_NAME,
  });

  if (!isDeal || !isString(stageValue)) {
    return { isLocked: false, lockReason: null };
  }

  const pipeline = findDealPipeline({
    pipelines,
    pipelineKey: isString(pipelineKey) ? pipelineKey : null,
    stageValue,
  });

  if (!isDealLockedForViewer({ pipeline, isAdmin, stageValue })) {
    return { isLocked: false, lockReason: null };
  }

  const stageLabel =
    pipeline?.stages.find(({ value }) => value === stageValue)?.label ??
    stageValue;

  return {
    isLocked: true,
    lockReason: t`Deals in ${stageLabel} can only be edited by Super Admins`,
  };
};
