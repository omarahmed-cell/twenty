import { createAtomState } from '@/ui/utilities/state/jotai/utils/createAtomState';

export type RoboostRecentRecord = {
  objectNameSingular: string;
  recordId: string;
  label: string;
};

export const roboostRecentRecordsState = createAtomState<RoboostRecentRecord[]>(
  {
    key: 'roboostRecentRecords',
    defaultValue: [],
    useLocalStorage: true,
  },
);
