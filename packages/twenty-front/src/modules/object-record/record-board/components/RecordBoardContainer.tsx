import { useObjectMetadataItem } from '@/object-metadata/hooks/useObjectMetadataItem';
import { useCreateOneRecord } from '@/object-record/hooks/useCreateOneRecord';
import { useDeleteOneRecord } from '@/object-record/hooks/useDeleteOneRecord';
import { useObjectPermissionsForObject } from '@/object-record/hooks/useObjectPermissionsForObject';
import { useUpdateOneRecord } from '@/object-record/hooks/useUpdateOneRecord';
import { RecordBoard } from '@/object-record/record-board/components/RecordBoard';
import { RecordBoardBodyEscapeHotkeyEffect } from '@/object-record/record-board/components/RecordBoardBodyEscapeHotkeyEffect';
import { RecordBoardHotkeyEffect } from '@/object-record/record-board/components/RecordBoardHotkeyEffect';
import { RecordBoardContext } from '@/object-record/record-board/contexts/RecordBoardContext';
import { RecordBoardComponentInstanceContext } from '@/object-record/record-board/states/contexts/RecordBoardComponentInstanceContext';
import { recordIndexGroupFieldMetadataItemComponentState } from '@/object-record/record-index/states/recordIndexGroupFieldMetadataComponentState';

import { RecordIndexRemoveSortingModal } from '@/object-record/record-index/components/RecordIndexRemoveSortingModal';

import { useHasPipelineObjects } from '@/pipeline/hooks/useHasPipelineObjects';
import { PipelineBoardScopeEffect } from '@/pipeline/board/components/PipelineBoardScopeEffect';
import { PipelineBoardSwitcher } from '@/pipeline/board/components/PipelineBoardSwitcher';
import { isPipelineBoardEligible } from '@/pipeline/board/utils/isPipelineBoardEligible';
import { useAtomComponentStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentStateValue';
import { styled } from '@linaria/react';
import { isDefined } from 'twenty-shared/utils';

const StyledPipelineBoardContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const StyledPipelineBoardContent = styled.div`
  flex: 1;
  min-height: 0;
`;

type RecordBoardContainerProps = {
  recordBoardId: string;
  viewBarId: string;
  objectNameSingular: string;
};

export const RecordBoardContainer = ({
  recordBoardId,
  objectNameSingular,
}: RecordBoardContainerProps) => {
  const { objectMetadataItem } = useObjectMetadataItem({
    objectNameSingular,
  });

  const objectPermissions = useObjectPermissionsForObject(
    objectMetadataItem.id,
  );

  const recordIndexGroupFieldMetadataItem = useAtomComponentStateValue(
    recordIndexGroupFieldMetadataItemComponentState,
  );

  const { deleteOneRecord } = useDeleteOneRecord({ objectNameSingular });
  const { updateOneRecord: updateOneRecordHook } = useUpdateOneRecord();
  const { createOneRecord } = useCreateOneRecord({
    objectNameSingular,
    shouldMatchRootQueryFilter: true,
  });

  const updateOneRecord = (args: {
    idToUpdate: string;
    updateOneRecordInput: Record<string, unknown>;
  }) =>
    updateOneRecordHook({
      objectNameSingular,
      ...args,
    });

  const hasPipelineObjects = useHasPipelineObjects();

  if (!isDefined(recordIndexGroupFieldMetadataItem)) {
    return null;
  }

  const isPipelineBoard =
    hasPipelineObjects &&
    isPipelineBoardEligible({
      objectNameSingular,
      groupFieldName: recordIndexGroupFieldMetadataItem.name,
    });

  return (
    <RecordBoardContext.Provider
      value={{
        objectMetadataItem,
        selectFieldMetadataItem: recordIndexGroupFieldMetadataItem,
        createOneRecord,
        updateOneRecord,
        deleteOneRecord,
        recordBoardId,
        objectPermissions,
      }}
    >
      <RecordBoardComponentInstanceContext.Provider
        value={{ instanceId: recordBoardId }}
      >
        {isPipelineBoard ? (
          <StyledPipelineBoardContainer>
            <PipelineBoardScopeEffect objectNameSingular={objectNameSingular} />
            <PipelineBoardSwitcher
              recordBoardId={recordBoardId}
              objectNameSingular={objectNameSingular}
            />
            <StyledPipelineBoardContent>
              <RecordBoard />
            </StyledPipelineBoardContent>
          </StyledPipelineBoardContainer>
        ) : (
          <RecordBoard />
        )}
        <RecordIndexRemoveSortingModal />
        <RecordBoardHotkeyEffect />
        <RecordBoardBodyEscapeHotkeyEffect />
      </RecordBoardComponentInstanceContext.Provider>
    </RecordBoardContext.Provider>
  );
};
