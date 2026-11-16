import { useStore } from 'jotai';
import { useContext, useEffect } from 'react';

import { useNumberFormat } from '@/localization/hooks/useNumberFormat';
import { dateLocaleState } from '@/localization/states/dateLocaleState';
import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { transformAggregateRawValueIntoAggregateDisplayValue } from '@/object-record/record-aggregate/utils/transformAggregateRawValueIntoAggregateDisplayValue';
import { useRecordIndexContextOrThrow } from '@/object-record/record-index/contexts/RecordIndexContext';
import { useAggregateGqlFieldsFromRecordIndexGroupAggregates } from '@/object-record/record-index/hooks/useAggregateGqlFieldsFromRecordIndexGroupAggregates';
import { useRecordIndexGroupsAggregatesGroupBy } from '@/object-record/record-index/hooks/useRecordIndexGroupsAggregatesGroupBy';
import { turnRecordIndexGroupByAggregateQueryResultIntoRecordAggregateValueByGroupValue } from '@/object-record/record-index/utils/turnRecordIndexGroupByAggregateQueryResultIntoRecordAggregateValueByGroupValue';
import { pipelineBoardWeightedAmountDisplayValueComponentFamilyState } from '@/pipeline/board/states/pipelineBoardWeightedAmountDisplayValueComponentFamilyState';
import { type PipelineBoardScope } from '@/pipeline/board/types/PipelineBoardScope';
import { buildPipelineBoardWeightedAmountByStageValue } from '@/pipeline/board/utils/buildPipelineBoardWeightedAmountByStageValue';
import { useAtomComponentFamilyStateCallbackState } from '@/ui/utilities/state/jotai/hooks/useAtomComponentFamilyStateCallbackState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { UserContext } from '@/users/contexts/UserContext';
import { isDefined } from 'twenty-shared/utils';
import { AggregateOperations } from '~/generated-metadata/graphql';

type PipelineBoardWeightedAmountQueryEffectProps = {
  groupByFieldMetadataItem: FieldMetadataItem;
  weightedAmountFieldMetadataItem: FieldMetadataItem;
  pipelineBoardScope: PipelineBoardScope;
};

// The second column total next to the board's own aggregate, summed the same way as Amount
export const PipelineBoardWeightedAmountQueryEffect = ({
  groupByFieldMetadataItem,
  weightedAmountFieldMetadataItem,
  pipelineBoardScope,
}: PipelineBoardWeightedAmountQueryEffectProps) => {
  const { objectMetadataItem } = useRecordIndexContextOrThrow();
  const { dateFormat, timeFormat, timeZone } = useContext(UserContext);
  const dateLocale = useAtomStateValue(dateLocaleState);
  const { numberFormat } = useNumberFormat();
  const store = useStore();

  const { data, loading, error } = useRecordIndexGroupsAggregatesGroupBy({
    objectMetadataItem,
    groupByFieldMetadataItem,
    recordIndexGroupAggregateFieldMetadataItem: weightedAmountFieldMetadataItem,
    recordIndexGroupAggregateOperation: AggregateOperations.SUM,
  });

  const { recordAggregateGqlField } =
    useAggregateGqlFieldsFromRecordIndexGroupAggregates({
      objectMetadataItem,
      recordIndexGroupAggregateFieldMetadataItem:
        weightedAmountFieldMetadataItem,
      recordIndexGroupAggregateOperation: AggregateOperations.SUM,
    });

  const weightedAmountDisplayValueCallbackState =
    useAtomComponentFamilyStateCallbackState(
      pipelineBoardWeightedAmountDisplayValueComponentFamilyState,
    );

  useEffect(() => {
    if (
      loading ||
      isDefined(error) ||
      !isDefined(data) ||
      !isDefined(recordAggregateGqlField)
    ) {
      return;
    }

    const { recordAggregateValueByGroupValueArray } =
      turnRecordIndexGroupByAggregateQueryResultIntoRecordAggregateValueByGroupValue(
        {
          objectMetadataItem,
          queryResult: data,
          recordAggregateGqlField,
        },
      );

    const weightedAmountByStageValue =
      buildPipelineBoardWeightedAmountByStageValue({
        recordAggregateValueByGroupValueArray,
        stageValues: pipelineBoardScope.stageValues,
      });

    for (const [stageValue, rawValue] of Object.entries(
      weightedAmountByStageValue,
    )) {
      store.set(
        weightedAmountDisplayValueCallbackState({ stageValue }),
        transformAggregateRawValueIntoAggregateDisplayValue({
          aggregateFieldMetadataItem: weightedAmountFieldMetadataItem,
          aggregateOperation: AggregateOperations.SUM,
          aggregateRawValue: rawValue,
          dateFormat,
          timeFormat,
          timeZone,
          localeCatalog: dateLocale.localeCatalog,
          numberFormat,
        }),
      );
    }
  }, [
    data,
    loading,
    error,
    recordAggregateGqlField,
    objectMetadataItem,
    pipelineBoardScope,
    weightedAmountFieldMetadataItem,
    weightedAmountDisplayValueCallbackState,
    store,
    dateFormat,
    timeFormat,
    timeZone,
    dateLocale,
    numberFormat,
  ]);

  return null;
};
