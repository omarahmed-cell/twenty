import { AppErrorBoundary } from '@/error-handler/components/AppErrorBoundary';
import { AppFullScreenErrorFallback } from '@/error-handler/components/AppFullScreenErrorFallback';
import { AppPageErrorFallback } from '@/error-handler/components/AppPageErrorFallback';
import { DefaultLayoutNavigationDrawer } from '@/app/components/DefaultLayoutNavigationDrawer';
import { FileUploadProvider } from '@/file-upload/components/FileUploadProvider';
import { InformationBannerIsImpersonating } from '@/information-banner/components/impersonate/InformationBannerIsImpersonating';
import { KeyboardShortcutMenu } from '@/keyboard-shortcut-menu/components/KeyboardShortcutMenu';
import { LayoutCustomizationBar } from '@/layout-customization/components/LayoutCustomizationBar';
import { MobileNavigationBar } from '@/navigation/components/MobileNavigationBar';
import { PageDragDropProvider } from '@/navigation-menu-item/display/dnd/providers/PageDragDropProvider';
import { useIsSettingsPage } from '@/navigation/hooks/useIsSettingsPage';
import { RoboostAppSideNav } from '@/roboost-app/components/RoboostAppSideNav';
import { RoboostCreateRecordPanel } from '@/roboost-app/components/RoboostCreateRecordPanel';
import { RoboostPreferencesEffect } from '@/roboost-app/components/RoboostPreferencesEffect';
import { RoboostSettingsSideNav } from '@/roboost-app/components/RoboostSettingsSideNav';
import { roboostModeState } from '@/roboost-app/states/roboostModeState';
import { roboostNavCollapsedState } from '@/roboost-app/states/roboostNavCollapsedState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { RoboostTopBar } from '@/roboost-app/components/RoboostTopBar';
import { useIsRoboostUiEnabled } from '@/roboost-app/hooks/useIsRoboostUiEnabled';
import { AppShell } from '@/roboost-ui/components/AppShell';
import { useShowFullscreen } from '@/ui/layout/fullscreen/hooks/useShowFullscreen';
import { useIsMobile } from 'twenty-ui/utilities';
import { styled } from '@linaria/react';
import { Outlet } from 'react-router-dom';
import { themeCssVariables } from 'twenty-ui/theme';
const StyledLayout = styled.div`
  background: ${themeCssVariables.grayScale.gray3};
  display: flex;
  flex-direction: column;
  height: calc(100dvh / var(--t-zoom, 1));
  overflow: clip;
  position: relative;
  scrollbar-color: ${themeCssVariables.border.color.medium} transparent;
  scrollbar-width: 4px;
  width: 100%;

  *::-webkit-scrollbar-thumb {
    border-radius: ${themeCssVariables.border.radius.md};
  }

  @media print {
    background: ${themeCssVariables.background.primary};
    height: auto;
    min-height: 100%;
    overflow: visible;
  }
`;

const StyledPageContainer = styled.div`
  display: flex;
  flex: 1 1 auto;
  flex-direction: row;
  min-height: 0;
  min-width: 0;

  @media print {
    display: block;
    min-height: auto;
    min-width: auto;
    overflow: visible;
  }
`;

const StyledMainContainer = styled.div`
  display: flex;
  flex: 0 1 100%;
  min-width: 0;

  @media print {
    display: block;
    min-width: auto;
    overflow: visible;
  }
`;

export const DefaultLayout = () => {
  const isMobile = useIsMobile();
  const isRoboostUiEnabled = useIsRoboostUiEnabled();
  const isSettingsPage = useIsSettingsPage();
  const showFullscreen = useShowFullscreen();

  const roboostMode = useAtomStateValue(roboostModeState);
  const roboostNavCollapsed = useAtomStateValue(roboostNavCollapsedState);

  const isRoboostShellShown =
    isRoboostUiEnabled && !isMobile && !showFullscreen;

  return (
    <>
      <FileUploadProvider>
        <StyledLayout>
          <AppErrorBoundary FallbackComponent={AppFullScreenErrorFallback}>
            <InformationBannerIsImpersonating />
            <LayoutCustomizationBar />
            <StyledPageContainer>
              <PageDragDropProvider>
                <KeyboardShortcutMenu />
                {isRoboostUiEnabled && <RoboostPreferencesEffect />}
                {isRoboostUiEnabled && <RoboostCreateRecordPanel />}
                {isRoboostShellShown ? (
                  <AppShell
                    mode={roboostMode}
                    collapsed={!isSettingsPage && roboostNavCollapsed}
                    topbar={<RoboostTopBar />}
                    nav={
                      isSettingsPage ? (
                        <RoboostSettingsSideNav />
                      ) : (
                        <RoboostAppSideNav />
                      )
                    }
                  >
                    <AppErrorBoundary FallbackComponent={AppPageErrorFallback}>
                      <Outlet />
                    </AppErrorBoundary>
                  </AppShell>
                ) : (
                  <>
                    <DefaultLayoutNavigationDrawer />
                    <StyledMainContainer>
                      <AppErrorBoundary
                        FallbackComponent={AppPageErrorFallback}
                      >
                        <Outlet />
                      </AppErrorBoundary>
                    </StyledMainContainer>
                  </>
                )}
              </PageDragDropProvider>
            </StyledPageContainer>
            {isMobile && <MobileNavigationBar />}
          </AppErrorBoundary>
        </StyledLayout>
      </FileUploadProvider>
    </>
  );
};
