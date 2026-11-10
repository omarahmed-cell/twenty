import { recordStoreFamilyState } from '@/object-record/record-store/states/recordStoreFamilyState';
import { useAtomFamilyStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomFamilyStateValue';

export const useRecordCreatorName = (
  recordId: string | null,
): string | undefined => {
  const recordStore = useAtomFamilyStateValue(
    recordStoreFamilyState,
    recordId ?? '',
  );

  return recordStore?.createdBy?.name;
};
