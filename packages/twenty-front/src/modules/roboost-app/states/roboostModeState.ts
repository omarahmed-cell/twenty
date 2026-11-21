import { type RoboostMode } from '@/roboost-ui/types/RoboostMode';
import { createAtomState } from '@/ui/utilities/state/jotai/utils/createAtomState';

// Local copy of the member's saved mode so the first paint is already in the right colours
export const roboostModeState = createAtomState<RoboostMode>({
  key: 'roboostMode',
  defaultValue: 'roboost',
  useLocalStorage: true,
  localStorageOptions: { getOnInit: true },
});
