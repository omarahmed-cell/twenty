import { type RecordPagePanelState } from '@/page-layout/types/RecordPagePanelState';
import { createAtomState } from '@/ui/utilities/state/jotai/utils/createAtomState';

export const recordPageRightPanelState = createAtomState<RecordPagePanelState>({
  key: 'recordPageRightPanelState',
  defaultValue: 'auto',
  useLocalStorage: true,
});
