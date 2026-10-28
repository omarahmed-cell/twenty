import { type SegmentMembershipRequest } from '@/side-panel/pages/segment-membership/types/SegmentMembershipRequest';
import { SidePanelPageComponentInstanceContext } from '@/side-panel/states/contexts/SidePanelPageComponentInstanceContext';
import { createAtomComponentState } from '@/ui/utilities/state/jotai/utils/createAtomComponentState';

export const segmentMembershipRequestComponentState =
  createAtomComponentState<SegmentMembershipRequest>({
    key: 'side-panel/segment-membership-request',
    defaultValue: {
      operation: 'ADD',
      objectNameSingular: '',
      recordFilter: {},
    },
    componentInstanceContext: SidePanelPageComponentInstanceContext,
  });
