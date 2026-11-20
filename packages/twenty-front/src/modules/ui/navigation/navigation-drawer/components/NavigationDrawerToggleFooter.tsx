import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { IconChevronLeft, IconChevronRight } from 'twenty-ui/icon';
import { themeCssVariables } from 'twenty-ui/theme';

import { NAVIGATION_DRAWER_COLLAPSED_BUTTON_SIZE } from '@/ui/navigation/navigation-drawer/constants/NavigationDrawerCollapsedButtonSize';
import { useToggleNavigationDrawer } from '@/ui/navigation/navigation-drawer/hooks/useToggleNavigationDrawer';

const StyledFooter = styled.div`
  border-top: 1px solid ${themeCssVariables.border.color.medium};
  flex-shrink: 0;
  margin-top: auto;
  padding-top: ${themeCssVariables.spacing[2]};
`;

const StyledToggle = styled.button<{ isExpanded: boolean }>`
  align-items: center;
  background: transparent;
  border: none;
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.secondary};
  cursor: pointer;
  display: flex;
  font-family: ${themeCssVariables.font.family};
  font-size: ${themeCssVariables.font.size.md};
  gap: ${themeCssVariables.spacing[2]};
  height: ${themeCssVariables.spacing[8]};
  justify-content: ${({ isExpanded }) =>
    isExpanded ? 'flex-start' : 'center'};
  padding: 0 ${themeCssVariables.spacing[2]};
  width: ${({ isExpanded }) =>
    isExpanded
      ? `calc(100% - ${themeCssVariables.spacing[2]})`
      : `${NAVIGATION_DRAWER_COLLAPSED_BUTTON_SIZE}px`};

  &:hover {
    background: ${themeCssVariables.background.transparent.light};
    color: ${themeCssVariables.font.color.primary};
  }
`;

export const NavigationDrawerToggleFooter = () => {
  const { t } = useLingui();
  const { isNavigationDrawerExpanded, toggleNavigationDrawer } =
    useToggleNavigationDrawer();

  return (
    <StyledFooter>
      <StyledToggle
        type="button"
        isExpanded={isNavigationDrawerExpanded}
        aria-expanded={isNavigationDrawerExpanded}
        aria-label={
          isNavigationDrawerExpanded
            ? t`Collapse navigation`
            : t`Expand navigation`
        }
        onClick={toggleNavigationDrawer}
      >
        {isNavigationDrawerExpanded ? (
          <>
            <IconChevronLeft size={16} />
            {t`Collapse`}
          </>
        ) : (
          <IconChevronRight size={16} />
        )}
      </StyledToggle>
    </StyledFooter>
  );
};
