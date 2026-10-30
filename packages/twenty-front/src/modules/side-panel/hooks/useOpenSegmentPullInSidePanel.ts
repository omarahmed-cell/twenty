import { t } from '@lingui/core/macro';
import { useStore } from 'jotai';
import { useCallback } from 'react';
import { SidePanelPages } from 'twenty-shared/types';
import { IconArrowMerge } from 'twenty-ui/icon';
import { v4 } from 'uuid';

import { useSidePanelMenu } from '@/side-panel/hooks/useSidePanelMenu';
import { segmentPullSourceSegmentIdComponentState } from '@/side-panel/pages/segment-pull/states/segmentPullSourceSegmentIdComponentState';

export const useOpenSegmentPullInSidePanel = () => {
  const store = useStore();
  const { navigateSidePanelMenu } = useSidePanelMenu();

  const openSegmentPullInSidePanel = useCallback(
    (sourceSegmentId: string) => {
      const pageId = v4();

      store.set(
        segmentPullSourceSegmentIdComponentState.atomFamily({
          instanceId: pageId,
        }),
        sourceSegmentId,
      );

      navigateSidePanelMenu({
        page: SidePanelPages.SegmentPull,
        pageTitle: t`Pull associated records`,
        pageIcon: IconArrowMerge,
        pageId,
      });
    },
    [navigateSidePanelMenu, store],
  );

  return { openSegmentPullInSidePanel };
};
