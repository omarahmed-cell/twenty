import { RecordFiltersComponentInstanceContext } from '@/object-record/record-filter/states/context/RecordFiltersComponentInstanceContext';
import { type RecordFilter } from '@/object-record/record-filter/types/RecordFilter';
import { createAtomComponentState } from '@/ui/utilities/state/jotai/utils/createAtomComponentState';

// Always applied on top of currentRecordFilters and never shown as a chip, so users cannot remove it.
export const scopeRecordFiltersComponentState = createAtomComponentState<
  RecordFilter[]
>({
  key: 'scopeRecordFiltersComponentState',
  defaultValue: [],
  componentInstanceContext: RecordFiltersComponentInstanceContext,
});
