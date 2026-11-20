import { RoboostMark } from '@/ui/brand/components/RoboostMark';
import { RoboostWordmark } from '@/ui/brand/components/RoboostWordmark';
import { currentWorkspaceState } from '@/auth/states/currentWorkspaceState';
import {
  StyledContainer,
  StyledIconChevronDown,
  StyledLabelWrapper,
} from '@/navigation/components/MultiWorkspaceDropdown/internal/MultiWorkspacesDropdownStyles';
import { NavigationDrawerAnimatedCollapseWrapper } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerAnimatedCollapseWrapper';
import { useIsNavigationDrawerContentExpanded } from '@/ui/navigation/navigation-drawer/hooks/useIsNavigationDrawerContentExpanded';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { useTheme } from 'twenty-ui/theme';

type MultiWorkspaceDropdownClickableComponentProps = {
  disabled?: boolean;
  shouldHideLabel?: boolean;
};

export const MultiWorkspaceDropdownClickableComponent = ({
  disabled,
  shouldHideLabel = false,
}: MultiWorkspaceDropdownClickableComponentProps) => {
  const theme = useTheme();
  const currentWorkspace = useAtomStateValue(currentWorkspaceState);

  const isNavigationDrawerExpanded = useIsNavigationDrawerContentExpanded();
  const isWorkspaceLabelVisible =
    !shouldHideLabel && isNavigationDrawerExpanded;
  return (
    <StyledContainer
      data-testid="workspace-dropdown"
      title={currentWorkspace?.displayName ?? undefined}
      isNavigationDrawerExpanded={isNavigationDrawerExpanded}
      disabled={disabled}
    >
      {isWorkspaceLabelVisible ? (
        <RoboostWordmark />
      ) : (
        <RoboostMark height={20} />
      )}
      {!shouldHideLabel && (
        <>
          <StyledLabelWrapper aria-hidden />
          <NavigationDrawerAnimatedCollapseWrapper>
            <StyledIconChevronDown
              size={theme.icon.size.md}
              stroke={theme.icon.stroke.sm}
            />
          </NavigationDrawerAnimatedCollapseWrapper>
        </>
      )}
    </StyledContainer>
  );
};
