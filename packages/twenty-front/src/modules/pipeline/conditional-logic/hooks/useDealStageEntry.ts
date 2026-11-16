import { useMemo } from 'react';
import { CoreObjectNameSingular } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

import { objectMetadataItemsSelector } from '@/object-metadata/states/objectMetadataItemsSelector';
import { useLazyFindOneRecord } from '@/object-record/hooks/useLazyFindOneRecord';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { DEAL_STAGE_ENTRY_DIALOG_ID } from '@/pipeline/conditional-logic/constants/DealStageEntryDialogId';
import {
  dealStageEntryDialogRequestState,
  type DealStageEntryValues,
} from '@/pipeline/conditional-logic/states/dealStageEntryDialogRequestState';
import { buildConditionalLogicFields } from '@/pipeline/conditional-logic/utils/buildConditionalLogicFields';
import {
  type DealStageEntryRequirement,
  getDealStageEntryRequirement,
} from '@/pipeline/conditional-logic/utils/getDealStageEntryRequirement';
import { useDealStagePipelineConfigs } from '@/pipeline/stage-picker/hooks/useDealStagePipelineConfigs';
import { useDialog } from '@/ui/layout/dialog/hooks/useDialog';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { useSetAtomState } from '@/ui/utilities/state/jotai/hooks/useSetAtomState';

export type DealStageEntryTarget = {
  targetStageValue: string | null | undefined;
  targetPipelineKey?: string | null;
};

export type DealStageEntryDecision =
  | { status: 'proceed' }
  | { status: 'cancelled' }
  | { status: 'confirmed'; values: DealStageEntryValues };

export const useDealStageEntry = ({ enabled }: { enabled: boolean }) => {
  const pipelines = useDealStagePipelineConfigs({ enabled });
  const objectMetadataItems = useAtomStateValue(objectMetadataItemsSelector);
  const setDealStageEntryDialogRequest = useSetAtomState(
    dealStageEntryDialogRequestState,
  );
  const { openDialog } = useDialog();

  // Views only load their visible columns, so the fields a rule reads are fetched fresh
  const { findOneRecord } = useLazyFindOneRecord({
    objectNameSingular: CoreObjectNameSingular.Opportunity,
    fetchPolicy: 'network-only',
  });

  const dealFieldMetadataItems = objectMetadataItems.find(
    ({ nameSingular }) => nameSingular === CoreObjectNameSingular.Opportunity,
  )?.fields;

  const fields = useMemo(
    () => buildConditionalLogicFields(dealFieldMetadataItems ?? []),
    [dealFieldMetadataItems],
  );

  const hasStageRules = (targetStageValue: string | null | undefined) =>
    enabled &&
    pipelines.some(({ stages }) =>
      stages.some(
        ({ value, conditionalRules }) =>
          value === targetStageValue && conditionalRules.length > 0,
      ),
    );

  const loadDealRecord = async (
    recordId: string,
    fallbackRecord: Record<string, unknown>,
  ): Promise<Record<string, unknown>> => {
    let loadedRecord: ObjectRecord | undefined;

    try {
      await findOneRecord({
        objectRecordId: recordId,
        onCompleted: (record) => {
          loadedRecord = record;
        },
      });
    } catch {
      return fallbackRecord;
    }

    return { ...fallbackRecord, ...loadedRecord };
  };

  const getRequirement = ({
    record,
    targetStageValue,
    targetPipelineKey,
  }: DealStageEntryTarget & {
    record: Record<string, unknown>;
  }): DealStageEntryRequirement | null =>
    getDealStageEntryRequirement({
      pipelines,
      record,
      targetStageValue,
      targetPipelineKey,
      fields,
    });

  const askForStageEntryValues = ({
    requirement,
    record,
  }: {
    requirement: DealStageEntryRequirement;
    record: Record<string, unknown>;
  }) =>
    new Promise<DealStageEntryValues | null>((resolve) => {
      setDealStageEntryDialogRequest({ requirement, record, resolve });
      openDialog(DEAL_STAGE_ENTRY_DIALOG_ID);
    });

  const resolveStageEntry = async ({
    recordId,
    fallbackRecord,
    targetStageValue,
    targetPipelineKey,
  }: DealStageEntryTarget & {
    recordId: string;
    fallbackRecord: Record<string, unknown>;
  }): Promise<DealStageEntryDecision> => {
    if (!hasStageRules(targetStageValue)) {
      return { status: 'proceed' };
    }

    const record = await loadDealRecord(recordId, fallbackRecord);
    const requirement = getRequirement({
      record,
      targetStageValue,
      targetPipelineKey,
    });

    if (!isDefined(requirement) || !requirement.isDialogNeeded) {
      return { status: 'proceed' };
    }

    const values = await askForStageEntryValues({ requirement, record });

    return isDefined(values)
      ? { status: 'confirmed', values }
      : { status: 'cancelled' };
  };

  return {
    pipelines,
    fields,
    hasStageRules,
    loadDealRecord,
    getRequirement,
    resolveStageEntry,
  };
};
