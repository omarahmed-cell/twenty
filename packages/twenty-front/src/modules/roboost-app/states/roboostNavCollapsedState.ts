import { createAtomState } from '@/ui/utilities/state/jotai/utils/createAtomState';

// Starts on the icon rail; each member's choice is then remembered
export const roboostNavCollapsedState = createAtomState<boolean>({
  key: 'roboostNavCollapsed',
  defaultValue: true,
  useLocalStorage: true,
});
