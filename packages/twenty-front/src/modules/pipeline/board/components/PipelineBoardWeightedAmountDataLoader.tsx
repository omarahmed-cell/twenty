import { useRecordIndexContextOrThrow } from '@/object-record/record-index/contexts/RecordIndexContext';
import { recordIndexGroupFieldMetadataItemComponentState } from '@/object-record/record-index/states/recordIndexGroupFieldMetadataComponentState';
import { PipelineBoardWeightedAmountQueryEffect } from '@/pipeline/board/components/PipelineBoardWeightedAmountQueryEffect';
import { usePipelineBoardScope } from '@/pipeline/board/hooks/usePipelineBoardScope';
import { PIPELINE_BOARD_WEIGHTED_AMOUNT_FIELD_NAME } from '@/pipeline/board/utils/buildPipelineBoardWeightedAmountByStageValue';
import { useAtomComponentStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentStateValue';
import { isDefined } from 'twenty-shared/utils';

export const PipelineBoardWeightedAmountDataLoader = () => {
  const { objectMetadataItem } = useRecordIndexContextOrThrow();
  const pipelineBoardScope = usePipelineBoardScope();

  const recordIndexGroupFieldMetadataItem = useAtomComponentStateValue(
    recordIndexGroupFieldMetadataItemComponentState,
  );

  const weightedAmountFieldMetadataItem =
    objectMetadataItem.readableFields.find(
      ({ name }) => name === PIPELINE_BOARD_WEIGHTED_AMOUNT_FIELD_NAME,
    );

  if (
    !isDefined(pipelineBoardScope) ||
    !isDefined(recordIndexGroupFieldMetadataItem) ||
    !isDefined(weightedAmountFieldMetadataItem)
  ) {
    return null;
  }

  return (
    <PipelineBoardWeightedAmountQueryEffect
      groupByFieldMetadataItem={recordIndexGroupFieldMetadataItem}
      weightedAmountFieldMetadataItem={weightedAmountFieldMetadataItem}
      pipelineBoardScope={pipelineBoardScope}
    />
  );
};
