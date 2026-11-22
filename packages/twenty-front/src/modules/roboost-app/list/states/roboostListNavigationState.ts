import { createAtomState } from '@/ui/utilities/state/jotai/utils/createAtomState';

export type RoboostListNavigation = {
  objectNameSingular: string;
  recordIds: string[];
};

export const roboostListNavigationState =
  createAtomState<RoboostListNavigation | null>({
    key: 'roboostListNavigation',
    defaultValue: null,
  });
