import { RecordTableDeactivateRecordTableRowEffect } from '@/object-record/record-table/components/RecordTableDeactivateRecordTableRowEffect';
import { RecordTableEmptyHasNewRecordEffect } from '@/object-record/record-table/components/RecordTableEmptyHasNewRecordEffect';
import { RecordTableBodyFocusClickOutsideEffect } from '@/object-record/record-table/record-table-body/components/RecordTableBodyFocusClickOutsideEffect';
import { RecordTableRecordGroupBodyEffects } from '@/object-record/record-table/record-table-body/components/RecordTableRecordGroupBodyEffects';
import { RecordTableNoRecordGroupScrollToPreviousRecordEffect } from '@/object-record/record-table/virtualization/components/RecordTableNoRecordGroupScrollToPreviousRecordEffect';
import { RecordTableVirtualizedFieldMetadataUpdateEffect } from '@/object-record/record-table/virtualization/components/RecordTableVirtualizedFieldMetadataUpdateEffect';
import { RecordTableVirtualizedInitialDataLoadEffect } from '@/object-record/record-table/virtualization/components/RecordTableVirtualizedInitialDataLoadEffect';

export interface RecordTableBodyEffectsWrapperProps {
  hasRecordGroups: boolean;
  tableBodyRef: React.RefObject<HTMLDivElement | null>;
}

export const RecordTableBodyEffectsWrapper = ({
  hasRecordGroups,
  tableBodyRef,
}: RecordTableBodyEffectsWrapperProps) => {
  return (
    <>
      {hasRecordGroups ? (
        <RecordTableRecordGroupBodyEffects />
      ) : (
        <>
          <RecordTableEmptyHasNewRecordEffect />
          <RecordTableNoRecordGroupScrollToPreviousRecordEffect />
          <RecordTableVirtualizedInitialDataLoadEffect />
          <RecordTableVirtualizedFieldMetadataUpdateEffect />
        </>
      )}
      <RecordTableBodyFocusClickOutsideEffect tableBodyRef={tableBodyRef} />
      <RecordTableDeactivateRecordTableRowEffect />
    </>
  );
};
