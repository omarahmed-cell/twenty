import { type RecordFilter } from '@/object-record/record-filter/types/RecordFilter';
import { scopeRecordFiltersComponentState } from '@/object-record/record-filter/states/scopeRecordFiltersComponentState';
import { useAtomComponentStateCallbackState } from '@/ui/utilities/state/jotai/hooks/useAtomComponentStateCallbackState';
import { useStore } from 'jotai';
import { useLayoutEffect } from 'react';

type SegmentMembersScopeEffectProps = {
  scopeRecordFilter: RecordFilter;
};

export const SegmentMembersScopeEffect = ({
  scopeRecordFilter,
}: SegmentMembersScopeEffectProps) => {
  const store = useStore();

  const scopeRecordFiltersAtom = useAtomComponentStateCallbackState(
    scopeRecordFiltersComponentState,
  );

  useLayoutEffect(() => {
    store.set(scopeRecordFiltersAtom, [scopeRecordFilter]);

    return () => store.set(scopeRecordFiltersAtom, []);
  }, [scopeRecordFilter, scopeRecordFiltersAtom, store]);

  return null;
};
