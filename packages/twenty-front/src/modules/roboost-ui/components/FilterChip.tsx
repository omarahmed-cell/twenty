import { Icon } from '@/roboost-ui/components/Icon';
import { Menu, type MenuEntry } from '@/roboost-ui/components/Menu';
import { ROBOOST_UI_THEME } from '@/roboost-ui/constants/RoboostUiTheme';
import { styled } from '@linaria/react';
import { type ReactNode } from 'react';

const StyledChip = styled.button<{ isActive: boolean }>`
  align-items: center;
  background: ${({ isActive }) =>
    isActive ? ROBOOST_UI_THEME.accentSoft : ROBOOST_UI_THEME.surface};
  border: 1px solid
    ${({ isActive }) =>
      isActive ? ROBOOST_UI_THEME.accentBorder : ROBOOST_UI_THEME.borderStrong};
  border-radius: ${ROBOOST_UI_THEME.radiusSm};
  color: ${ROBOOST_UI_THEME.textSecondary};
  cursor: pointer;
  display: inline-flex;
  font-family: ${ROBOOST_UI_THEME.fontSans};
  font-size: 13px;
  font-weight: 500;
  gap: 6px;
  height: 30px;
  line-height: 16px;
  padding: 0 10px;
  white-space: nowrap;

  > svg {
    color: ${ROBOOST_UI_THEME.textMuted};
  }

  &:hover {
    background: ${ROBOOST_UI_THEME.surfaceHover};
    color: ${ROBOOST_UI_THEME.text};
  }

  &:focus-visible {
    box-shadow: ${ROBOOST_UI_THEME.shadowFocus};
    outline: none;
  }
`;

const StyledValue = styled.span`
  color: ${ROBOOST_UI_THEME.text};
  font-weight: 500;
`;

export type FilterChipProps = {
  label: ReactNode;
  value?: ReactNode;
  isActive?: boolean;
  entries: MenuEntry[];
  keepOpenOnSelect?: boolean;
};

export const FilterChip = ({
  label,
  value,
  isActive = false,
  entries,
  keepOpenOnSelect = false,
}: FilterChipProps) => (
  <Menu
    entries={entries}
    keepOpenOnSelect={keepOpenOnSelect}
    trigger={({ toggle, isOpen }) => (
      <StyledChip
        type="button"
        isActive={isActive}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        onClick={toggle}
      >
        {label}
        {value !== undefined && <StyledValue>{value}</StyledValue>}
        <Icon name="caret" size={14} />
      </StyledChip>
    )}
  />
);
