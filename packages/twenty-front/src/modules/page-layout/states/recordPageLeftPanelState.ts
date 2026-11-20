import { type RecordPagePanelState } from '@/page-layout/types/RecordPagePanelState';
import { createAtomState } from '@/ui/utilities/state/jotai/utils/createAtomState';

export const recordPageLeftPanelState = createAtomState<RecordPagePanelState>({
  key: 'recordPageLeftPanelState',
  defaultValue: 'auto',
  useLocalStorage: true,
});
