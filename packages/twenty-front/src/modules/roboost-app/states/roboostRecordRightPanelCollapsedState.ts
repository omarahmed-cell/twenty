import { createAtomState } from '@/ui/utilities/state/jotai/utils/createAtomState';

export const roboostRecordRightPanelCollapsedState = createAtomState<boolean>({
  key: 'roboostRecordRightPanelCollapsed',
  defaultValue: false,
  useLocalStorage: true,
});
