import { type RecordAggregateValueByRecordGroupValue } from '@/object-record/record-index/types/RecordAggregateValueByRecordGroupValue';
import { isDefined } from 'twenty-shared/utils';

// In company currency so deals in different currencies add up
export const PIPELINE_BOARD_WEIGHTED_AMOUNT_FIELD_NAME =
  'weightedAmountInCompanyCurrency';

// Columns without a group-by result are empty stages, so their weighted total is 0
export const buildPipelineBoardWeightedAmountByStageValue = ({
  recordAggregateValueByGroupValueArray,
  stageValues,
}: {
  recordAggregateValueByGroupValueArray: RecordAggregateValueByRecordGroupValue[];
  stageValues: string[];
}): Record<string, string | number> =>
  Object.fromEntries(
    stageValues.map((stageValue) => {
      const aggregateValue = recordAggregateValueByGroupValueArray.find(
        ({ recordGroupValue }) => recordGroupValue === stageValue,
      )?.recordAggregateValue;

      return [stageValue, isDefined(aggregateValue) ? aggregateValue : 0];
    }),
  );
