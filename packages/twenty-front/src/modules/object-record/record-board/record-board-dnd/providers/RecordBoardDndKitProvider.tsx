import { useStore } from 'jotai';
import { type ReactNode, useContext } from 'react';

import { RecordBoardContext } from '@/object-record/record-board/contexts/RecordBoardContext';
import { RecordBoardCardDragOverlayContent } from '@/object-record/record-board/record-board-card/components/RecordBoardCardDragOverlayContent';
import { draggedRecordIdsComponentState } from '@/object-record/record-drag/states/draggedRecordIdsComponentState';
import { recordStoreFamilyState } from '@/object-record/record-store/states/recordStoreFamilyState';
import { RecordDragDropContextProvider } from '@/object-record/record-drag/components/RecordDragDropContextProvider';
import { useProcessBoardCardDrop } from '@/object-record/record-drag/hooks/useProcessBoardCardDrop';
import { recordIndexRecordIdsByGroupComponentFamilyState } from '@/object-record/record-index/states/recordIndexRecordIdsByGroupComponentFamilyState';
import { recordGroupDefinitionFamilyState } from '@/object-record/record-group/states/recordGroupDefinitionFamilyState';
import { type RecordDragDropResult } from '@/object-record/record-drag/types/RecordDragDropResult';
import { usePipelineBoardScope } from '@/pipeline/board/hooks/usePipelineBoardScope';
import { useDealStageEntry } from '@/pipeline/conditional-logic/hooks/useDealStageEntry';
import { getDealBulkStageEntryRefusal } from '@/pipeline/conditional-logic/utils/getDealBulkStageEntryRefusal';
import { isDealStageFieldMetadataItem } from '@/pipeline/stage-picker/utils/dealStageFields';
import { isPipelineBoardDropAllowed } from '@/pipeline/board/utils/isPipelineBoardDropAllowed';
import { useIsPipelineAdmin } from '@/pipeline/rules/hooks/useIsPipelineAdmin';
import { getDealStageDisabledReason } from '@/pipeline/rules/utils/getDealStageDisabledReason';
import { isDefined } from 'twenty-shared/utils';
import { useToast } from 'twenty-ui/components';
import { useAtomComponentFamilyStateCallbackState } from '@/ui/utilities/state/jotai/hooks/useAtomComponentFamilyStateCallbackState';
import { useAtomComponentStateCallbackState } from '@/ui/utilities/state/jotai/hooks/useAtomComponentStateCallbackState';

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

  const draggedRecordIdsCallbackState = useAtomComponentStateCallbackState(
    draggedRecordIdsComponentState,
  );

  const { processBoardCardDrop } = useProcessBoardCardDrop();

  const { selectFieldMetadataItem } = useContext(RecordBoardContext);
  const isDealStageBoard = isDealStageFieldMetadataItem(
    selectFieldMetadataItem,
  );
  const { hasStageRules, loadDealRecord, getRequirement, resolveStageEntry } =
    useDealStageEntry({ enabled: isDealStageBoard });

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

    const targetStageValue = destinationRecordGroup?.value;

    if (
      !isDealStageBoard ||
      sourceRecordGroup?.value === targetStageValue ||
      !hasStageRules(targetStageValue)
    ) {
      processBoardCardDrop(recordDragDropResult);

      return;
    }

    void dropIntoStageWithRules(recordDragDropResult, targetStageValue);
  };

  // Nothing moves until the stage's rules are satisfied, so a cancelled drop leaves the card where it was
  const dropIntoStageWithRules = async (
    recordDragDropResult: RecordDragDropResult,
    targetStageValue: string | null | undefined,
  ) => {
    const capturedRecordIds = store.get(draggedRecordIdsCallbackState);
    const draggedRecordIds =
      capturedRecordIds.length > 0
        ? capturedRecordIds
        : [recordDragDropResult.draggedRecordId];
    const fallbackRecordOf = (recordId: string) =>
      store.get(recordStoreFamilyState.atomFamily(recordId)) ?? {};

    if (draggedRecordIds.length > 1) {
      const records = await Promise.all(
        draggedRecordIds.map((recordId) =>
          loadDealRecord(recordId, fallbackRecordOf(recordId)),
        ),
      );
      const bulkRefusal = getDealBulkStageEntryRefusal(
        records.map((record) => getRequirement({ record, targetStageValue })),
      );

      if (isDefined(bulkRefusal)) {
        enqueueToast({ status: 'error', children: bulkRefusal });

        return;
      }

      processBoardCardDrop(recordDragDropResult, { draggedRecordIds });

      return;
    }

    const decision = await resolveStageEntry({
      recordId: recordDragDropResult.draggedRecordId,
      fallbackRecord: fallbackRecordOf(recordDragDropResult.draggedRecordId),
      targetStageValue,
    });

    if (decision.status === 'cancelled') {
      return;
    }

    processBoardCardDrop(recordDragDropResult, {
      draggedRecordIds,
      additionalUpdateInput:
        decision.status === 'confirmed' ? decision.values : undefined,
    });
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
