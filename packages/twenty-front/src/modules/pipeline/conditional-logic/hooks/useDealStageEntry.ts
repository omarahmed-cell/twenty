import { useLingui } from '@lingui/react/macro';
import { useMemo } from 'react';
import { CoreObjectNameSingular } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

import { objectMetadataItemsSelector } from '@/object-metadata/states/objectMetadataItemsSelector';
import { useLazyFindOneRecord } from '@/object-record/hooks/useLazyFindOneRecord';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { useConditionalLogicFieldsDialog } from '@/conditional-logic/hooks/useConditionalLogicFieldsDialog';
import { type ConditionalLogicFieldsDialogValues } from '@/conditional-logic/states/conditionalLogicFieldsDialogRequestState';
import { buildConditionalLogicFields } from '@/conditional-logic/utils/buildConditionalLogicFields';
import {
  type DealStageEntryRequirement,
  getDealStageEntryRequirement,
} from '@/pipeline/conditional-logic/utils/getDealStageEntryRequirement';
import { useDealStagePipelineConfigs } from '@/pipeline/stage-picker/hooks/useDealStagePipelineConfigs';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import {
  DEAL_PIPELINE_FIELD_NAME,
  DEAL_STAGE_FIELD_NAME,
} from '@/pipeline/stage-picker/utils/dealStageFields';

export type DealStageEntryTarget = {
  targetStageValue: string | null | undefined;
  targetPipelineKey?: string | null;
};

export type DealStageEntryDecision =
  | { status: 'proceed' }
  | { status: 'cancelled' }
  | { status: 'confirmed'; values: ConditionalLogicFieldsDialogValues };

export const useDealStageEntry = ({
  enabled,
  objectNameSingular = CoreObjectNameSingular.Opportunity,
}: {
  enabled: boolean;
  objectNameSingular?: string;
}) => {
  const pipelines = useDealStagePipelineConfigs({
    enabled,
    objectNameSingular,
  });
  const objectMetadataItems = useAtomStateValue(objectMetadataItemsSelector);
  const { t } = useLingui();
  const { askForConditionalLogicValues } = useConditionalLogicFieldsDialog();

  // Views only load their visible columns, so the fields a rule reads are fetched fresh
  const { findOneRecord } = useLazyFindOneRecord({
    objectNameSingular,
    fetchPolicy: 'network-only',
  });

  const dealFieldMetadataItems = objectMetadataItems.find(
    ({ nameSingular }) => nameSingular === objectNameSingular,
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
  }) => {
    const stageLabel = requirement.stage.label;

    return askForConditionalLogicValues({
      objectNameSingular,
      title: t`Move to ${stageLabel}`,
      confirmLabel: t`Move`,
      hint:
        objectNameSingular === CoreObjectNameSingular.Opportunity
          ? t`Fill the required fields to move this deal.`
          : t`Fill the required fields to move this record.`,
      properties: requirement.properties,
      rules: requirement.stage.conditionalRules,
      record,
      recordOverrides: {
        [DEAL_STAGE_FIELD_NAME]: requirement.stage.value,
        [DEAL_PIPELINE_FIELD_NAME]: requirement.pipeline.key,
      },
    });
  };

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
