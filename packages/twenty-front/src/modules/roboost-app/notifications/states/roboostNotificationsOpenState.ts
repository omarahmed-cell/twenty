import { createAtomState } from '@/ui/utilities/state/jotai/utils/createAtomState';

export const roboostNotificationsOpenState = createAtomState<boolean>({
  key: 'roboostNotificationsOpen',
  defaultValue: false,
});
