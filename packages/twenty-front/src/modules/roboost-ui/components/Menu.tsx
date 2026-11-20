import { Icon } from '@/roboost-ui/components/Icon';
import { ROBOOST_UI_THEME } from '@/roboost-ui/constants/RoboostUiTheme';
import { type RoboostIconName } from '@/roboost-ui/types/RoboostIconName';
import { css } from '@linaria/core';
import { styled } from '@linaria/react';
import { type FocusEvent, type ReactNode, useState } from 'react';
import { Link } from 'react-router-dom';

const StyledAnchor = styled.div`
  display: inline-flex;
  position: relative;
`;

const StyledMenu = styled.div<{ align: 'left' | 'right' }>`
  background: ${ROBOOST_UI_THEME.surface};
  border: 1px solid ${ROBOOST_UI_THEME.border};
  border-radius: ${ROBOOST_UI_THEME.radiusSm};
  box-shadow: ${ROBOOST_UI_THEME.shadowMd};
  left: ${({ align }) => (align === 'left' ? '0' : 'auto')};
  max-height: 320px;
  min-width: 200px;
  overflow: auto;
  padding: 4px;
  position: absolute;
  right: ${({ align }) => (align === 'right' ? '0' : 'auto')};
  top: calc(100% + 4px);
  z-index: 40;
`;

const menuItemClassName = css`
  align-items: center;
  background: none;
  border: none;
  border-radius: ${ROBOOST_UI_THEME.radiusXs};
  color: ${ROBOOST_UI_THEME.text};
  cursor: pointer;
  display: flex;
  font-family: ${ROBOOST_UI_THEME.fontSans};
  font-size: 14px;
  gap: 8px;
  padding: 8px 8px 8px 12px;
  text-align: left;
  text-decoration: none;
  white-space: nowrap;
  width: 100%;

  > svg {
    color: ${ROBOOST_UI_THEME.textMuted};
  }

  &:hover {
    background: ${ROBOOST_UI_THEME.surfaceHover};
  }

  &[aria-checked='true'] {
    color: ${ROBOOST_UI_THEME.accentText};
    font-weight: 500;
  }
`;

const StyledItemLabel = styled.span`
  flex: 1;
`;

const StyledSeparator = styled.div`
  background: ${ROBOOST_UI_THEME.borderSubtle};
  height: 1px;
  margin: 4px 0;
`;

export type MenuEntry =
  | {
      id: string;
      label: string;
      icon?: RoboostIconName;
      isSelected?: boolean;
      onSelect: () => void;
    }
  | { id: string; label: string; icon?: RoboostIconName; href: string }
  | { id: string; isSeparator: true };

export type MenuProps = {
  trigger: (props: { isOpen: boolean; toggle: () => void }) => ReactNode;
  entries: MenuEntry[];
  align?: 'left' | 'right';
  header?: ReactNode;
  keepOpenOnSelect?: boolean;
};

export const Menu = ({
  trigger,
  entries,
  align = 'left',
  header,
  keepOpenOnSelect = false,
}: MenuProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const closeWhenFocusLeaves = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setIsOpen(false);
    }
  };

  return (
    <StyledAnchor onBlur={closeWhenFocusLeaves}>
      {trigger({ isOpen, toggle: () => setIsOpen(!isOpen) })}
      {isOpen && (
        <StyledMenu
          align={align}
          role="menu"
          tabIndex={-1}
          onMouseDown={(event) => event.preventDefault()}
        >
          {header}
          {entries.map((entry) => {
            if ('isSeparator' in entry) {
              return <StyledSeparator key={entry.id} />;
            }

            const content = (
              <>
                {entry.icon !== undefined && (
                  <Icon name={entry.icon} size={16} />
                )}
                <StyledItemLabel>{entry.label}</StyledItemLabel>
                {'isSelected' in entry && entry.isSelected === true && (
                  <Icon name="check" size={16} />
                )}
              </>
            );

            if ('href' in entry) {
              return (
                <Link
                  key={entry.id}
                  to={entry.href}
                  role="menuitem"
                  className={menuItemClassName}
                  onClick={() => setIsOpen(false)}
                >
                  {content}
                </Link>
              );
            }

            return (
              <button
                key={entry.id}
                type="button"
                role={
                  entry.isSelected !== undefined
                    ? 'menuitemcheckbox'
                    : 'menuitem'
                }
                aria-checked={entry.isSelected}
                className={menuItemClassName}
                onClick={() => {
                  entry.onSelect();
                  if (!keepOpenOnSelect) {
                    setIsOpen(false);
                  }
                }}
              >
                {content}
              </button>
            );
          })}
        </StyledMenu>
      )}
    </StyledAnchor>
  );
};
