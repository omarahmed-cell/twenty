import { createAtomState } from '@/ui/utilities/state/jotai/utils/createAtomState';

export type RoboostFieldHistoryTarget = {
  objectNameSingular: string;
  recordId: string;
  fieldName: string;
};

export const roboostFieldHistoryState =
  createAtomState<RoboostFieldHistoryTarget | null>({
    key: 'roboostFieldHistory',
    defaultValue: null,
  });
