import { createAtomState } from '@/ui/utilities/state/jotai/utils/createAtomState';

export const segmentMembersViewCreationInFlightObjectMetadataIdsState =
  createAtomState<string[]>({
    key: 'segmentMembersViewCreationInFlightObjectMetadataIdsState',
    defaultValue: [],
  });
