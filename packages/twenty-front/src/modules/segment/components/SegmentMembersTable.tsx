import { RecordIndexContainerContextStoreNumberOfSelectedRecordsEffect } from '@/object-record/record-index/components/RecordIndexContainerContextStoreNumberOfSelectedRecordsEffect';
import { RecordIndexFiltersToContextStoreEffect } from '@/object-record/record-index/components/RecordIndexFiltersToContextStoreEffect';
import { RecordIndexTableContainerEffect } from '@/object-record/record-index/components/RecordIndexTableContainerEffect';
import { useRecordIndexContextOrThrow } from '@/object-record/record-index/contexts/RecordIndexContext';
import { scopeRecordFiltersComponentState } from '@/object-record/record-filter/states/scopeRecordFiltersComponentState';
import { RecordTableWithWrappers } from '@/object-record/record-table/components/RecordTableWithWrappers';
import { SegmentMembersTableStatesEffect } from '@/segment/components/SegmentMembersTableStatesEffect';
import { useAtomComponentStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentStateValue';
import { styled } from '@linaria/react';
import { isNonEmptyArray } from 'twenty-shared/utils';

const StyledTableContainer = styled.div`
  flex: 1;
  min-height: 0;
  overflow: hidden;
`;

export const SegmentMembersTable = () => {
  const { recordIndexId, objectNameSingular } = useRecordIndexContextOrThrow();

  const scopeRecordFilters = useAtomComponentStateValue(
    scopeRecordFiltersComponentState,
  );

  // Never query before the segment scope is in place.
  if (!isNonEmptyArray(scopeRecordFilters)) {
    return null;
  }

  return (
    <>
      <SegmentMembersTableStatesEffect />
      <RecordIndexTableContainerEffect />
      <RecordIndexFiltersToContextStoreEffect />
      <RecordIndexContainerContextStoreNumberOfSelectedRecordsEffect />
      <StyledTableContainer>
        <RecordTableWithWrappers
          recordTableId={recordIndexId}
          objectNameSingular={objectNameSingular}
          viewBarId={recordIndexId}
        />
      </StyledTableContainer>
    </>
  );
};
