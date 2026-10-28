import { t } from '@lingui/core/macro';
import { useStore } from 'jotai';
import { useCallback } from 'react';
import { SidePanelPages } from 'twenty-shared/types';
import { IconPlaylistAdd, IconMinus } from 'twenty-ui/icon';
import { v4 } from 'uuid';

import { useSidePanelMenu } from '@/side-panel/hooks/useSidePanelMenu';
import { segmentMembershipRequestComponentState } from '@/side-panel/pages/segment-membership/states/segmentMembershipRequestComponentState';
import { type SegmentMembershipRequest } from '@/side-panel/pages/segment-membership/types/SegmentMembershipRequest';

export const useOpenSegmentMembershipInSidePanel = () => {
  const store = useStore();
  const { navigateSidePanelMenu } = useSidePanelMenu();

  const openSegmentMembershipInSidePanel = useCallback(
    (request: SegmentMembershipRequest) => {
      const pageId = v4();

      store.set(
        segmentMembershipRequestComponentState.atomFamily({
          instanceId: pageId,
        }),
        request,
      );

      navigateSidePanelMenu({
        page: SidePanelPages.SegmentMembership,
        pageTitle:
          request.operation === 'ADD'
            ? t`Add to segment`
            : t`Remove from segment`,
        pageIcon: request.operation === 'ADD' ? IconPlaylistAdd : IconMinus,
        pageId,
      });
    },
    [navigateSidePanelMenu, store],
  );

  return { openSegmentMembershipInSidePanel };
};
