import { createAtomState } from '@/ui/utilities/state/jotai/utils/createAtomState';

export const roboostRecordLeftPanelCollapsedState = createAtomState<boolean>({
  key: 'roboostRecordLeftPanelCollapsed',
  defaultValue: false,
  useLocalStorage: true,
});
