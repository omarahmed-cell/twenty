import { createAtomState } from '@/ui/utilities/state/jotai/utils/createAtomState';

export type RoboostScoreWhyTarget = {
  objectNameSingular: string;
  recordId: string;
  fieldMetadataId: string;
  fieldLabel: string;
};

export const roboostScoreWhyState =
  createAtomState<RoboostScoreWhyTarget | null>({
    key: 'roboostScoreWhy',
    defaultValue: null,
  });
