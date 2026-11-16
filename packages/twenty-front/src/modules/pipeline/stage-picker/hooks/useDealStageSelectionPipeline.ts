import { contextStoreAnyFieldFilterValueComponentState } from '@/context-store/states/contextStoreAnyFieldFilterValueComponentState';
import { contextStoreFilterGroupsComponentState } from '@/context-store/states/contextStoreFilterGroupsComponentState';
import { contextStoreFiltersComponentState } from '@/context-store/states/contextStoreFiltersComponentState';
import { contextStoreTargetedRecordsRuleComponentState } from '@/context-store/states/contextStoreTargetedRecordsRuleComponentState';
import { computeContextStoreFilters } from '@/context-store/utils/computeContextStoreFilters';
import { useObjectMetadataItem } from '@/object-metadata/hooks/useObjectMetadataItem';
import { flattenedFieldMetadataItemsSelector } from '@/object-metadata/states/flattenedFieldMetadataItemsSelector';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { useFilterValueDependencies } from '@/object-record/record-filter/hooks/useFilterValueDependencies';
import { DEAL_PIPELINE_FIELD_NAME } from '@/pipeline/stage-picker/utils/dealStageFields';
import {
  getSharedPipelineKey,
  type SharedPipelineKeyResult,
} from '@/pipeline/stage-picker/utils/getStageOptionsForPipeline';
import { useAtomComponentStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentStateValue';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { isString } from '@sniptt/guards';
import {
  CoreObjectNameSingular,
  type RecordGqlOperationFilter,
} from 'twenty-shared/types';

// Two one-row reads tell a single pipeline from several without loading the whole selection
export const useDealStageSelectionPipeline = ({
  objectNameSingular,
  contextStoreInstanceId,
}: {
  objectNameSingular: string;
  contextStoreInstanceId: string;
}): { result: SharedPipelineKeyResult; loading: boolean } => {
  const { objectMetadataItem } = useObjectMetadataItem({
    objectNameSingular,
  });

  const isDealSelection =
    objectNameSingular === CoreObjectNameSingular.Opportunity &&
    objectMetadataItem.fields.some(
      ({ name }) => name === DEAL_PIPELINE_FIELD_NAME,
    );

  const contextStoreTargetedRecordsRule = useAtomComponentStateValue(
    contextStoreTargetedRecordsRuleComponentState,
    contextStoreInstanceId,
  );
  const contextStoreFilters = useAtomComponentStateValue(
    contextStoreFiltersComponentState,
    contextStoreInstanceId,
  );
  const contextStoreFilterGroups = useAtomComponentStateValue(
    contextStoreFilterGroupsComponentState,
    contextStoreInstanceId,
  );
  const contextStoreAnyFieldFilterValue = useAtomComponentStateValue(
    contextStoreAnyFieldFilterValueComponentState,
    contextStoreInstanceId,
  );
  const { filterValueDependencies } = useFilterValueDependencies();
  const flattenedFieldMetadataItems = useAtomStateValue(
    flattenedFieldMetadataItemsSelector,
  );

  const selectionFilter = computeContextStoreFilters({
    contextStoreTargetedRecordsRule,
    contextStoreFilters,
    contextStoreFilterGroups,
    objectMetadataItem,
    fieldMetadataItems: flattenedFieldMetadataItems,
    filterValueDependencies,
    contextStoreAnyFieldFilterValue,
  });

  const { records: firstRecords, loading: firstLoading } = useFindManyRecords({
    objectNameSingular,
    filter: selectionFilter,
    recordGqlFields: { id: true, [DEAL_PIPELINE_FIELD_NAME]: true },
    limit: 1,
    skip: !isDealSelection,
  });

  const firstPipelineKey = firstRecords[0]?.[DEAL_PIPELINE_FIELD_NAME];

  const { records: otherPipelineRecords, loading: otherLoading } =
    useFindManyRecords({
      objectNameSingular,
      filter: {
        and: [
          selectionFilter ?? {},
          {
            not: {
              [DEAL_PIPELINE_FIELD_NAME]: { in: [firstPipelineKey] },
            },
          },
        ],
      } as RecordGqlOperationFilter,
      recordGqlFields: { id: true, [DEAL_PIPELINE_FIELD_NAME]: true },
      limit: 1,
      skip: !isDealSelection || !isString(firstPipelineKey),
    });

  return {
    result: getSharedPipelineKey([
      isString(firstPipelineKey) ? firstPipelineKey : null,
      ...otherPipelineRecords.map(
        (record) => record[DEAL_PIPELINE_FIELD_NAME] as string | null,
      ),
    ]),
    loading: firstLoading || otherLoading,
  };
};
