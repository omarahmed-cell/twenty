import { createAtomState } from '@/ui/utilities/state/jotai/utils/createAtomState';

export const roboostTopBarTitleState = createAtomState<string | null>({
  key: 'roboostTopBarTitle',
  defaultValue: null,
});
