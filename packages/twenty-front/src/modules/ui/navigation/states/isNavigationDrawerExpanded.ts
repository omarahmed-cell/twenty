import { createAtomState } from '@/ui/utilities/state/jotai/utils/createAtomState';

// Starts on the collapsed icon rail (hidden on mobile); the member's choice is then remembered in local storage
export const isNavigationDrawerExpandedState = createAtomState<boolean>({
  key: 'isNavigationDrawerExpanded',
  defaultValue: false,
  useLocalStorage: true,
});
