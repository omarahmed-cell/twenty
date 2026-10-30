import { SidePanelPageComponentInstanceContext } from '@/side-panel/states/contexts/SidePanelPageComponentInstanceContext';
import { createAtomComponentState } from '@/ui/utilities/state/jotai/utils/createAtomComponentState';

export const segmentPullSourceSegmentIdComponentState =
  createAtomComponentState<string | null>({
    key: 'side-panel/segment-pull-source-segment-id',
    defaultValue: null,
    componentInstanceContext: SidePanelPageComponentInstanceContext,
  });
