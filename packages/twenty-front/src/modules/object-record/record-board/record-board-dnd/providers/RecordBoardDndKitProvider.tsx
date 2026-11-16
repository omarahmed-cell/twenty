import { useStore } from 'jotai';
import type { ReactNode } from 'react';

import { RecordBoardCardDragOverlayContent } from '@/object-record/record-board/record-board-card/components/RecordBoardCardDragOverlayContent';
import { RecordDragDropContextProvider } from '@/object-record/record-drag/components/RecordDragDropContextProvider';
import { useProcessBoardCardDrop } from '@/object-record/record-drag/hooks/useProcessBoardCardDrop';
import { recordIndexRecordIdsByGroupComponentFamilyState } from '@/object-record/record-index/states/recordIndexRecordIdsByGroupComponentFamilyState';
import { recordGroupDefinitionFamilyState } from '@/object-record/record-group/states/recordGroupDefinitionFamilyState';
import { type RecordDragDropResult } from '@/object-record/record-drag/types/RecordDragDropResult';
import { usePipelineBoardScope } from '@/pipeline/board/hooks/usePipelineBoardScope';
import { isPipelineBoardDropAllowed } from '@/pipeline/board/utils/isPipelineBoardDropAllowed';
import { useIsPipelineAdmin } from '@/pipeline/rules/hooks/useIsPipelineAdmin';
import { getDealStageDisabledReason } from '@/pipeline/rules/utils/getDealStageDisabledReason';
import { isDefined } from 'twenty-shared/utils';
import { useToast } from 'twenty-ui/components';
import { useAtomComponentFamilyStateCallbackState } from '@/ui/utilities/state/jotai/hooks/useAtomComponentFamilyStateCallbackState';

type RecordBoardDndKitProviderProps = {
  children: ReactNode;
};

export const RecordBoardDndKitProvider = ({
  children,
}: RecordBoardDndKitProviderProps) => {
  const store = useStore();

  const recordIdsByGroupCallbackState =
    useAtomComponentFamilyStateCallbackState(
      recordIndexRecordIdsByGroupComponentFamilyState,
    );

  const { processBoardCardDrop } = useProcessBoardCardDrop();

  const pipelineBoardScope = usePipelineBoardScope();
  const isPipelineAdmin = useIsPipelineAdmin();
  const { enqueueToast } = useToast();

  const handleRecordDrop = (recordDragDropResult: RecordDragDropResult) => {
    const destinationRecordGroup = store.get(
      recordGroupDefinitionFamilyState.atomFamily(
        recordDragDropResult.destinationDroppableId,
      ),
    );

    if (
      !isPipelineBoardDropAllowed({
        scope: pipelineBoardScope,
        targetStageValue: destinationRecordGroup?.value,
      })
    ) {
      return;
    }

    const sourceRecordGroup = store.get(
      recordGroupDefinitionFamilyState.atomFamily(
        recordDragDropResult.sourceDroppableId,
      ),
    );
    const ruleRefusal = isDefined(pipelineBoardScope)
      ? getDealStageDisabledReason({
          pipeline: pipelineBoardScope.pipeline,
          isAdmin: isPipelineAdmin,
          isCreate: false,
          currentStageValue: sourceRecordGroup?.value,
          targetStageValue: destinationRecordGroup?.value ?? '',
        })
      : null;

    if (isDefined(ruleRefusal)) {
      enqueueToast({ status: 'error', children: ruleRefusal });

      return;
    }

    processBoardCardDrop(recordDragDropResult);
  };

  return (
    <RecordDragDropContextProvider
      getDroppableItemCount={(droppableId) =>
        store.get(recordIdsByGroupCallbackState(droppableId)).length
      }
      onRecordDrop={handleRecordDrop}
      renderDragOverlay={(source) => (
        <RecordBoardCardDragOverlayContent source={source} />
      )}
    >
      {children}
    </RecordDragDropContextProvider>
  );
};
