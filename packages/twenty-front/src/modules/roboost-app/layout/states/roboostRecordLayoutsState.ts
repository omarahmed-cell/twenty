import { createAtomState } from '@/ui/utilities/state/jotai/utils/createAtomState';

export type RoboostRecordLayoutRecord = {
  id: string;
  objectMetadataId: string;
  roleId: string | null;
  teamId: string | null;
  layout: unknown;
};

export const roboostRecordLayoutsState = createAtomState<
  RoboostRecordLayoutRecord[] | null
>({
  key: 'roboostRecordLayoutsState',
  defaultValue: null,
});
