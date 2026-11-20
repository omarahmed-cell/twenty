import { PageLayoutContent } from '@/page-layout/components/PageLayoutContent';
import { PageLayoutScrollResetEffect } from '@/page-layout/components/PageLayoutScrollResetEffect';
import { RecordPagePanelChrome } from '@/page-layout/components/RecordPagePanelChrome';
import { RecordPageQuickActions } from '@/page-layout/components/RecordPageQuickActions';
import { RECORD_PAGE_PANEL_CLASS_NAMES } from '@/page-layout/constants/RecordPagePanelClassNames';
import { PageLayoutContentProvider } from '@/page-layout/contexts/PageLayoutContentContext';
import { useCurrentPageLayout } from '@/page-layout/hooks/useCurrentPageLayout';
import { usePageLayoutTabWithVisibleWidgetsOrThrow } from '@/page-layout/hooks/usePageLayoutTabWithVisibleWidgetsOrThrow';
import { type RecordPagePanelSide } from '@/page-layout/types/RecordPagePanelSide';
import { getScrollWrapperInstanceIdFromPageLayoutAndRecord } from '@/page-layout/utils/getScrollWrapperInstanceIdFromPageLayoutAndRecord';
import { getTabLayoutMode } from '@/page-layout/utils/getTabLayoutMode';
import { useLayoutRenderingContext } from '@/ui/layout/contexts/LayoutRenderingContext';
import { useWorkspaceSurfaceScopedComponentInstanceId } from '@/ui/layout/hooks/useWorkspaceSurfaceScopedComponentInstanceId';
import { useTargetRecord } from '@/ui/layout/contexts/useTargetRecord';
import { ScrollWrapper } from '@/ui/utilities/scroll/components/ScrollWrapper';
import { styled } from '@linaria/react';
import { PageLayoutType } from '~/generated-metadata/graphql';
import { themeCssVariables } from 'twenty-ui/theme';

const StyledContainer = styled.div<{ side: RecordPagePanelSide }>`
  --record-card-background-color: ${themeCssVariables.background.secondary};

  background: var(--record-card-background-color);
  border-bottom-left-radius: ${({ side }) => (side === 'left' ? '8px' : '0')};
  border-left: ${({ side }) =>
    side === 'right'
      ? `1px solid ${themeCssVariables.border.color.medium}`
      : 'none'};
  border-right: ${({ side }) =>
    side === 'left'
      ? `1px solid ${themeCssVariables.border.color.medium}`
      : 'none'};
  box-sizing: border-box;
  height: 100%;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
`;

const StyledPanelBodyWithoutChrome = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: minmax(0, 1fr);
  height: 100%;

  .page-layout-scroll-wrapper {
    container-name: tab-viewport;
    container-type: size;
  }
`;

const StyledScrollContent = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100%;
`;

type PageLayoutLeftPanelProps = {
  pageLayoutId: string;
  pinnedLeftTabId: string;
  side?: RecordPagePanelSide;
  // Off in edit mode, where the pinned tab stays one undivided column
  hasPanelChrome?: boolean;
};

export const PageLayoutLeftPanel = ({
  pageLayoutId,
  pinnedLeftTabId,
  side = 'left',
  hasPanelChrome = false,
}: PageLayoutLeftPanelProps) => {
  const { currentPageLayout } = useCurrentPageLayout();
  const targetRecordIdentifier = useTargetRecord();
  const { layoutType } = useLayoutRenderingContext();
  const pinnedTab = usePageLayoutTabWithVisibleWidgetsOrThrow(pinnedLeftTabId);

  const scrollWrapperInstanceId = useWorkspaceSurfaceScopedComponentInstanceId(
    getScrollWrapperInstanceIdFromPageLayoutAndRecord({
      pageLayoutId,
      layoutType,
      targetRecordIdentifier,
      scrollWrapperArea: side === 'left' ? 'left-panel' : 'right-panel',
      pageLayoutTabId: pinnedLeftTabId,
    }),
  );
  if (currentPageLayout?.type !== PageLayoutType.RECORD_PAGE) {
    return null;
  }

  const layoutMode = getTabLayoutMode({
    tab: pinnedTab,
    pageLayoutType: currentPageLayout.type,
  });

  const content = (
    <PageLayoutContentProvider
      value={{
        tabId: pinnedLeftTabId,
        layoutMode,
        presentation: 'stack',
        widgetPlacement: hasPanelChrome
          ? side === 'left'
            ? 'record-panel'
            : 'associations-panel'
          : 'all',
      }}
    >
      <ScrollWrapper
        className="page-layout-scroll-wrapper"
        componentInstanceId={scrollWrapperInstanceId}
        defaultEnableXScroll={false}
        defaultEnableYScroll={true}
      >
        {hasPanelChrome && side === 'left' ? (
          <StyledScrollContent>
            <RecordPageQuickActions />
            <PageLayoutContent />
          </StyledScrollContent>
        ) : (
          <PageLayoutContent />
        )}
      </ScrollWrapper>
    </PageLayoutContentProvider>
  );

  return (
    <StyledContainer
      side={side}
      className={
        side === 'left'
          ? RECORD_PAGE_PANEL_CLASS_NAMES.leftPanel
          : RECORD_PAGE_PANEL_CLASS_NAMES.rightPanel
      }
    >
      <PageLayoutScrollResetEffect
        pageLayoutTabId={pinnedLeftTabId}
        scrollWrapperInstanceId={scrollWrapperInstanceId}
        targetRecordId={targetRecordIdentifier.id}
      />

      {hasPanelChrome ? (
        <RecordPagePanelChrome side={side}>{content}</RecordPagePanelChrome>
      ) : (
        // The pinned left panel is always a column of cards, even with a
        // single widget: solo presentation is a main-tab-area concept.
        <StyledPanelBodyWithoutChrome>{content}</StyledPanelBodyWithoutChrome>
      )}
    </StyledContainer>
  );
};
