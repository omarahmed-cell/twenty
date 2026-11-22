import { createAtomState } from '@/ui/utilities/state/jotai/utils/createAtomState';

export const roboostSearchOpenState = createAtomState<boolean>({
  key: 'roboostSearchOpen',
  defaultValue: false,
});
