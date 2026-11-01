import { useRecordIndexContextOrThrow } from '@/object-record/record-index/contexts/RecordIndexContext';
import { isRecordTableAddNewRowHiddenComponentState } from '@/object-record/record-table/states/isRecordTableAddNewRowHiddenComponentState';
import { useStore } from 'jotai';
import { useLayoutEffect } from 'react';

// A record created inline would not join the segment, so adding goes through the picker instead.
export const SegmentMembersTableStatesEffect = () => {
  const store = useStore();
  const { recordIndexId } = useRecordIndexContextOrThrow();

  useLayoutEffect(() => {
    store.set(
      isRecordTableAddNewRowHiddenComponentState.atomFamily({
        instanceId: recordIndexId,
      }),
      true,
    );
  }, [recordIndexId, store]);

  return null;
};
