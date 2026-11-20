import { TabListRoot } from '@/ui/layout/tab-list/components/TabListRoot';
import { Tabs } from 'twenty-ui/primitives/navigation';
import { PageLayoutWidgetDndProvider } from '@/page-layout/components/dnd/PageLayoutWidgetDndProvider';
import { PageLayoutLeftPanel } from '@/page-layout/components/PageLayoutLeftPanel';
import { PageLayoutPrerenderedTabIdsResetEffect } from '@/page-layout/components/PageLayoutPrerenderedTabIdsResetEffect';
import { PageLayoutRecordIdentifierBar } from '@/page-layout/components/PageLayoutRecordIdentifierBar';
import { PageLayoutScrollResetEffect } from '@/page-layout/components/PageLayoutScrollResetEffect';
import { PageLayoutTabList } from '@/page-layout/components/PageLayoutTabList';
import { PageLayoutTabListEffect } from '@/page-layout/components/PageLayoutTabListEffect';
import { PAGE_LAYOUT_LEFT_PANEL_CONTAINER_WIDTH } from '@/page-layout/constants/PageLayoutLeftPanelContainerWidth';
import { RECORD_PAGE_PANEL_CLASS_NAMES } from '@/page-layout/constants/RecordPagePanelClassNames';
import { RECORD_PAGE_PANEL_RAIL_WIDTH } from '@/page-layout/constants/RecordPagePanelRailWidth';
import { recordPageLeftPanelState } from '@/page-layout/states/recordPageLeftPanelState';
import { recordPageRightPanelState } from '@/page-layout/states/recordPageRightPanelState';
import { isAssociationWidget } from '@/page-layout/utils/isAssociationWidget';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { useCurrentPageLayoutOrThrow } from '@/page-layout/hooks/useCurrentPageLayoutOrThrow';
import { useIsPageLayoutInEditMode } from '@/page-layout/hooks/useIsPageLayoutInEditMode';
import { usePageLayoutAddTabStrategy } from '@/page-layout/hooks/usePageLayoutAddTabStrategy';
import { usePageLayoutRenderableTabs } from '@/page-layout/hooks/usePageLayoutRenderableTabs';
import { PageLayoutMainContent } from '@/page-layout/PageLayoutMainContent';
import { pageLayoutPrerenderedTabIdsComponentState } from '@/page-layout/states/pageLayoutPrerenderedTabIdsComponentState';
import { getScrollWrapperInstanceIdFromPageLayoutAndRecord } from '@/page-layout/utils/getScrollWrapperInstanceIdFromPageLayoutAndRecord';
import { getTabListInstanceIdFromPageLayoutAndRecord } from '@/page-layout/utils/getTabListInstanceIdFromPageLayoutAndRecord';
import { shouldEnableTabEditingFeatures } from '@/page-layout/utils/shouldEnableTabEditingFeatures';
import { shouldPrerenderPageLayoutTab } from '@/page-layout/utils/shouldPrerenderPageLayoutTab';
import { sortTabsByPosition } from '@/page-layout/utils/sortTabsByPosition';
import { useLayoutRenderingContext } from '@/ui/layout/contexts/LayoutRenderingContext';
import { useWorkspaceSurfaceScopedComponentInstanceId } from '@/ui/layout/hooks/useWorkspaceSurfaceScopedComponentInstanceId';
import { useWorkspaceSurface } from '@/ui/layout/hooks/useWorkspaceSurface';
import { activeTabIdComponentState } from '@/ui/layout/tab-list/states/activeTabIdComponentState';
import { useIsMobile } from 'twenty-ui/utilities';
import { ScrollWrapper } from '@/ui/utilities/scroll/components/ScrollWrapper';
import { useAtomComponentStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentStateValue';
import { styled } from '@linaria/react';
import { isDefined } from 'twenty-shared/utils';
import { MOBILE_VIEWPORT, themeCssVariables } from 'twenty-ui/theme';
import { PageLayoutType } from '~/generated-metadata/graphql';

const StyledRoot = styled.div`
  container-name: record-page;
  container-type: inline-size;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  width: 100%;

  @media print {
    display: block;
    height: auto;
  }
`;

// Side panels shrink to their minimum, then the right one and finally the left
// one fold to a rail, driven by the record page's own width (container queries)
const StyledPanelTracks = styled.div`
  --record-page-left-track: ${PAGE_LAYOUT_LEFT_PANEL_CONTAINER_WIDTH}px;
  --record-page-right-track: 0px;

  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;

  &[data-has-panel-chrome='true'] {
    --record-page-left-track: clamp(280px, 26cqi, 360px);
  }

  &[data-has-right-panel='true'] {
    --record-page-right-track: clamp(280px, 24cqi, 340px);
  }

  &[data-left-panel-state='collapsed'] {
    --record-page-left-track: ${RECORD_PAGE_PANEL_RAIL_WIDTH}px;

    .${RECORD_PAGE_PANEL_CLASS_NAMES.leftPanel} {
      .${RECORD_PAGE_PANEL_CLASS_NAMES.rail} {
        display: block;
      }
      .${RECORD_PAGE_PANEL_CLASS_NAMES.panelBody} {
        display: none;
      }
    }
  }

  &[data-has-right-panel='true'][data-right-panel-state='collapsed'] {
    --record-page-right-track: ${RECORD_PAGE_PANEL_RAIL_WIDTH}px;

    .${RECORD_PAGE_PANEL_CLASS_NAMES.rightPanel} {
      .${RECORD_PAGE_PANEL_CLASS_NAMES.rail} {
        display: block;
      }
      .${RECORD_PAGE_PANEL_CLASS_NAMES.panelBody} {
        display: none;
      }
    }
  }

  @container record-page (max-width: 1039px) {
    &[data-has-right-panel='true'][data-right-panel-state='auto'] {
      --record-page-right-track: ${RECORD_PAGE_PANEL_RAIL_WIDTH}px;

      .${RECORD_PAGE_PANEL_CLASS_NAMES.rightPanel} {
        .${RECORD_PAGE_PANEL_CLASS_NAMES.rail} {
          display: block;
        }
        .${RECORD_PAGE_PANEL_CLASS_NAMES.panelBody} {
          display: none;
        }
      }
    }
  }

  @container record-page (max-width: 803px) {
    &[data-has-panel-chrome='true'][data-left-panel-state='auto'] {
      --record-page-left-track: ${RECORD_PAGE_PANEL_RAIL_WIDTH}px;

      .${RECORD_PAGE_PANEL_CLASS_NAMES.leftPanel} {
        .${RECORD_PAGE_PANEL_CLASS_NAMES.rail} {
          display: block;
        }
        .${RECORD_PAGE_PANEL_CLASS_NAMES.panelBody} {
          display: none;
        }
      }
    }
  }

  @media print {
    display: block;
  }
`;

const StyledContainer = styled.div<{
  hasPinnedTab: boolean;
  hasRightPanel: boolean;
}>`
  display: grid;
  flex: 1;
  grid-template-columns: ${({ hasPinnedTab, hasRightPanel }) =>
    hasPinnedTab
      ? `var(--record-page-left-track) minmax(0, 1fr)${hasRightPanel ? ' var(--record-page-right-track)' : ''}`
      : '1fr'};
  grid-template-rows: minmax(0, 1fr);
  min-height: 0;
  width: 100%;

  @media print {
    display: block;
    height: auto;
    width: 100%;

    .page-layout-scroll-wrapper {
      container-name: none !important;
      container-type: normal !important;
    }

    .page-layout-viewport-filling-widget-slot {
      --widget-height: auto !important;

      height: auto !important;
      min-height: 0 !important;
      overflow: visible !important;

      .widget-card-header {
        position: static !important;
      }
    }
  }
`;

const StyledTabsAndDashboardContainer = styled.div`
  display: flex;
  flex-direction: column;
  overflow: hidden;

  @media print {
    display: block;
    overflow: visible;

    .page-layout-tab-list-print-hidden {
      display: none;
    }
  }
`;

// display: none, not a hidden <Activity>, which skips the effects Apollo fetches from (see pageLayoutTabPrerenderContract.test).
const StyledTabContentDisplay = styled.div<{ isActiveTab: boolean }>`
  display: ${({ isActiveTab }) => (isActiveTab ? 'contents' : 'none')};
`;

const StyledTabPanel = styled.div`
  align-items: start;
  min-height: 100%;

  &:not([hidden]) {
    display: grid;
  }
`;

const StyledScrollWrapperContainer = styled.div`
  flex: 1;
  min-height: 0;

  .page-layout-scroll-wrapper {
    container-name: tab-viewport;
    container-type: size;
  }

  // Reserve the floating mobile navigation bar's footprint.
  @media (max-width: ${MOBILE_VIEWPORT}px) {
    .page-layout-scroll-wrapper {
      box-sizing: border-box;
      padding-bottom: ${themeCssVariables.spacing[20]};
    }
  }

  @media print {
    min-height: auto;

    .page-layout-scroll-wrapper {
      height: auto;
      overflow: visible;
    }
  }
`;

export const PageLayoutTabsRenderer = () => {
  const workspaceSurface = useWorkspaceSurface();
  const { currentPageLayout } = useCurrentPageLayoutOrThrow();

  const { layoutType, targetRecordIdentifier, isRecordIdentifierBarHidden } =
    useLayoutRenderingContext();

  const isPageLayoutInEditMode = useIsPageLayoutInEditMode();

  const isMobile = useIsMobile();

  const activeTabId = useAtomComponentStateValue(activeTabIdComponentState);

  const scrollWrapperInstanceId = useWorkspaceSurfaceScopedComponentInstanceId(
    getScrollWrapperInstanceIdFromPageLayoutAndRecord({
      pageLayoutId: currentPageLayout.id,
      layoutType,
      targetRecordIdentifier,
      scrollWrapperArea: 'tab-content',
    }),
  );

  const tabListInstanceId = useWorkspaceSurfaceScopedComponentInstanceId(
    getTabListInstanceIdFromPageLayoutAndRecord({
      pageLayoutId: currentPageLayout.id,
      layoutType,
      targetRecordIdentifier,
    }),
  );

  const addTabStrategy = usePageLayoutAddTabStrategy({
    pageLayoutId: currentPageLayout.id,
    tabListInstanceId,
  });

  const canEnableTabEditing =
    isPageLayoutInEditMode &&
    shouldEnableTabEditingFeatures(currentPageLayout.type);

  const { tabsToRenderInTabList, pinnedLeftTab } =
    usePageLayoutRenderableTabs();

  const recordPageLeftPanel = useAtomStateValue(recordPageLeftPanelState);
  const recordPageRightPanel = useAtomStateValue(recordPageRightPanelState);

  const hasPanelChrome =
    isDefined(pinnedLeftTab) &&
    !isPageLayoutInEditMode &&
    currentPageLayout.type === PageLayoutType.RECORD_PAGE;

  const hasRightPanel =
    hasPanelChrome && pinnedLeftTab.widgets.some(isAssociationWidget);

  const sortedTabs = sortTabsByPosition(tabsToRenderInTabList);

  const activeTabExistsInRenderableTabs = sortedTabs.some(
    (tab) => tab.id === activeTabId,
  );

  const pageLayoutPrerenderedTabIds = useAtomComponentStateValue(
    pageLayoutPrerenderedTabIdsComponentState,
  );

  const tabsToMount = sortedTabs.filter(
    (tab) =>
      tab.id === activeTabId ||
      (!isPageLayoutInEditMode &&
        pageLayoutPrerenderedTabIds.includes(tab.id) &&
        shouldPrerenderPageLayoutTab({
          tab,
          pageLayoutType: currentPageLayout.type,
        })),
  );

  const shouldRenderRecordIdentifierBar =
    currentPageLayout.type === PageLayoutType.RECORD_PAGE &&
    isDefined(targetRecordIdentifier) &&
    isRecordIdentifierBarHidden !== true &&
    workspaceSurface.type !== 'side-panel' &&
    !isMobile;

  const shouldRenderTabList = sortedTabs.length > 1 || isPageLayoutInEditMode;
  const behaveAsLinks =
    workspaceSurface.type === 'main' && !isPageLayoutInEditMode;
  const hasTabPanels = shouldRenderTabList && !behaveAsLinks;

  const tabList = shouldRenderTabList && (
    <PageLayoutTabList
      aria-label={currentPageLayout.name}
      className="page-layout-tab-list-print-hidden"
      presentation={
        shouldRenderRecordIdentifierBar ? 'identifier-bar' : 'standalone'
      }
      centerTabs={shouldRenderRecordIdentifierBar && !isDefined(pinnedLeftTab)}
      tabs={sortedTabs}
      behaveAsLinks={behaveAsLinks}
      componentInstanceId={tabListInstanceId}
      addTabStrategy={addTabStrategy}
      isReorderEnabled={canEnableTabEditing}
      pageLayoutType={currentPageLayout.type}
    />
  );

  return (
    <PageLayoutWidgetDndProvider>
      <PageLayoutScrollResetEffect
        pageLayoutTabId={activeTabId}
        scrollWrapperInstanceId={scrollWrapperInstanceId}
        targetRecordId={targetRecordIdentifier?.id}
      />
      <PageLayoutPrerenderedTabIdsResetEffect />
      <TabListRoot
        componentInstanceId={tabListInstanceId}
        enabled={hasTabPanels}
      >
        <StyledRoot>
          <StyledPanelTracks
            data-has-panel-chrome={hasPanelChrome}
            data-has-right-panel={hasRightPanel}
            data-left-panel-state={
              hasPanelChrome ? recordPageLeftPanel : undefined
            }
            data-right-panel-state={
              hasRightPanel ? recordPageRightPanel : undefined
            }
          >
            {shouldRenderRecordIdentifierBar && (
              <PageLayoutRecordIdentifierBar
                targetRecordIdentifier={targetRecordIdentifier}
                pinnedTab={pinnedLeftTab}
                isPinnedTabEditable={isPageLayoutInEditMode}
                tabList={tabList}
              />
            )}

            <StyledContainer
              hasPinnedTab={isDefined(pinnedLeftTab)}
              hasRightPanel={hasRightPanel}
            >
              {isDefined(pinnedLeftTab) && (
                <PageLayoutLeftPanel
                  pageLayoutId={currentPageLayout.id}
                  pinnedLeftTabId={pinnedLeftTab.id}
                  hasPanelChrome={hasPanelChrome}
                />
              )}

              <StyledTabsAndDashboardContainer>
                <PageLayoutTabListEffect
                  isInEditMode={isPageLayoutInEditMode}
                  tabs={sortedTabs}
                  componentInstanceId={tabListInstanceId}
                  defaultTabToFocusOnMobileAndSidePanelId={
                    currentPageLayout.defaultTabToFocusOnMobileAndSidePanelId ??
                    undefined
                  }
                />
                {!shouldRenderRecordIdentifierBar && tabList}

                <StyledScrollWrapperContainer>
                  <ScrollWrapper
                    className="page-layout-scroll-wrapper"
                    componentInstanceId={scrollWrapperInstanceId}
                    defaultEnableXScroll={false}
                  >
                    {isDefined(activeTabId) &&
                      activeTabExistsInRenderableTabs &&
                      tabsToMount.map((tab) =>
                        hasTabPanels ? (
                          <Tabs.Panel
                            key={tab.id}
                            value={tab.id}
                            keepMounted
                            render={<StyledTabPanel />}
                          >
                            <PageLayoutMainContent tabId={tab.id} />
                          </Tabs.Panel>
                        ) : (
                          <StyledTabContentDisplay
                            key={tab.id}
                            isActiveTab={tab.id === activeTabId}
                          >
                            <PageLayoutMainContent tabId={tab.id} />
                          </StyledTabContentDisplay>
                        ),
                      )}
                  </ScrollWrapper>
                </StyledScrollWrapperContainer>
              </StyledTabsAndDashboardContainer>

              {hasRightPanel && (
                <PageLayoutLeftPanel
                  pageLayoutId={currentPageLayout.id}
                  pinnedLeftTabId={pinnedLeftTab.id}
                  side="right"
                  hasPanelChrome
                />
              )}
            </StyledContainer>
          </StyledPanelTracks>
        </StyledRoot>
      </TabListRoot>
    </PageLayoutWidgetDndProvider>
  );
};
