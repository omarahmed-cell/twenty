import { Icon } from '@/roboost-ui/components/Icon';
import { Mark } from '@/roboost-ui/components/Mark';
import { Wordmark } from '@/roboost-ui/components/Wordmark';
import { ROBOOST_UI_THEME } from '@/roboost-ui/constants/RoboostUiTheme';
import { type RoboostIconName } from '@/roboost-ui/types/RoboostIconName';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { type CSSProperties, type ReactNode, useState } from 'react';
import { Link } from 'react-router-dom';

const StyledNav = styled.nav<{ isCollapsed: boolean }>`
  background: ${ROBOOST_UI_THEME.surface};
  border-right: 1px solid ${ROBOOST_UI_THEME.border};
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: ${({ isCollapsed }) => (isCollapsed ? '12px 8px' : '12px')};
  transition: width 0.18s ease;
  width: ${({ isCollapsed }) => (isCollapsed ? '64px' : '240px')};

  [data-tip]::after {
    background: ${ROBOOST_UI_THEME.tooltipBackground};
    border-radius: ${ROBOOST_UI_THEME.radiusSm};
    box-shadow: ${ROBOOST_UI_THEME.shadowMd};
    color: ${ROBOOST_UI_THEME.textOnAccent};
    content: attr(data-tip);
    font-size: 12px;
    font-weight: 500;
    left: calc(100% + 10px);
    line-height: 16px;
    opacity: 0;
    padding: 4px 9px;
    pointer-events: none;
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    transition: opacity 0.12s ease;
    white-space: nowrap;
    z-index: 60;
  }

  &[data-collapsed='true'] [data-tip]:hover::after {
    opacity: 1;
    transition-delay: 0.45s;
  }
`;

const StyledHead = styled.div<{ isCollapsed: boolean }>`
  align-items: center;
  display: flex;
  gap: 8px;
  justify-content: ${({ isCollapsed }) =>
    isCollapsed ? 'center' : 'flex-start'};
  padding: ${({ isCollapsed }) => (isCollapsed ? '8px 0 16px' : '8px 8px 16px')};

  svg {
    display: block;
    height: 22px;
    width: auto;
  }
`;

const StyledSection = styled.div`
  color: ${ROBOOST_UI_THEME.textMuted};
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  padding: 12px 8px 4px;
  text-transform: uppercase;
`;

const StyledDivider = styled.div<{ isCollapsed: boolean }>`
  background: ${ROBOOST_UI_THEME.borderSubtle};
  flex: none;
  height: 1px;
  margin: ${({ isCollapsed }) => (isCollapsed ? '8px 6px' : '8px 4px')};
`;

const StyledItem = styled(Link)<{ isCollapsed: boolean }>`
  align-items: center;
  border-radius: ${ROBOOST_UI_THEME.radiusSm};
  color: ${ROBOOST_UI_THEME.textSecondary};
  cursor: pointer;
  display: flex;
  flex: none;
  font-size: 13px;
  font-weight: 500;
  gap: ${({ isCollapsed }) => (isCollapsed ? '0' : '10px')};
  justify-content: ${({ isCollapsed }) =>
    isCollapsed ? 'center' : 'flex-start'};
  line-height: 16px;
  padding: ${({ isCollapsed }) => (isCollapsed ? '8px 0' : '8px 10px')};
  position: relative;
  text-decoration: none;

  > svg {
    color: ${ROBOOST_UI_THEME.textMuted};
  }

  &:hover {
    background: ${ROBOOST_UI_THEME.surfaceHover};
    color: ${ROBOOST_UI_THEME.text};
  }

  &:hover > svg {
    color: ${ROBOOST_UI_THEME.textSecondary};
  }

  &[aria-current='page'] {
    background: ${ROBOOST_UI_THEME.surfaceNavActive};
    color: ${ROBOOST_UI_THEME.accentText};
  }

  &[aria-current='page'] > svg {
    color: ${ROBOOST_UI_THEME.accent};
  }

  &:focus-visible {
    box-shadow: ${ROBOOST_UI_THEME.shadowFocus};
    outline: none;
  }
`;

const StyledLabel = styled.span`
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledCount = styled.span<{ isActive: boolean }>`
  background: ${({ isActive }) =>
    isActive ? ROBOOST_UI_THEME.accentSoft : ROBOOST_UI_THEME.surfaceSunken};
  border-radius: 999px;
  color: ${({ isActive }) =>
    isActive ? ROBOOST_UI_THEME.accentText : ROBOOST_UI_THEME.textMuted};
  font-size: 11px;
  font-weight: 600;
  margin-left: auto;
  padding: 1px 6px;
`;

const StyledSpacer = styled.div`
  flex: 1;
`;

const StyledToggle = styled.button<{ isCollapsed: boolean }>`
  align-items: center;
  background: none;
  border: none;
  border-top: 1px solid ${ROBOOST_UI_THEME.borderSubtle};
  color: ${ROBOOST_UI_THEME.textMuted};
  cursor: pointer;
  display: flex;
  flex: none;
  font-family: ${ROBOOST_UI_THEME.fontSans};
  font-size: 13px;
  font-weight: 500;
  gap: 8px;
  justify-content: ${({ isCollapsed }) =>
    isCollapsed ? 'center' : 'flex-start'};
  margin-top: 8px;
  padding: ${({ isCollapsed }) => (isCollapsed ? '8px 0' : '8px 10px')};
  position: relative;
  width: 100%;

  &:hover {
    color: ${ROBOOST_UI_THEME.text};
  }
`;

export type NavItem = {
  id: string;
  label: string;
  icon?: RoboostIconName;
  count?: number;
  active?: boolean;
  href?: string;
};

export type NavGroup = { label?: string; items: NavItem[] };

export type SideNavProps = {
  items?: NavItem[];
  groups?: NavGroup[];
  collapsed?: boolean;
  defaultCollapsed?: boolean;
  persistKey?: string;
  onToggle?: (collapsed: boolean) => void;
  showToggle?: boolean;
  brand?: ReactNode;
  footer?: ReactNode;
  onSelect?: (id: string) => void;
  className?: string;
  style?: CSSProperties;
};

const readPersistedCollapsed = (
  persistKey: string | undefined,
  fallback: boolean,
) => {
  if (persistKey === undefined) {
    return fallback;
  }
  try {
    const stored = window.localStorage.getItem(persistKey);

    return stored === null ? fallback : stored === '1';
  } catch {
    return fallback;
  }
};

export const SideNav = ({
  items = [],
  groups,
  collapsed,
  defaultCollapsed = false,
  persistKey,
  onToggle,
  showToggle = true,
  brand,
  footer,
  onSelect,
  className,
  style,
}: SideNavProps) => {
  const { t } = useLingui();
  const [uncontrolledCollapsed, setUncontrolledCollapsed] = useState(() =>
    readPersistedCollapsed(persistKey, defaultCollapsed),
  );
  const isCollapsed = collapsed ?? uncontrolledCollapsed;
  const navGroups = groups ?? [{ items }];

  const toggle = () => {
    const next = !isCollapsed;

    if (collapsed === undefined) {
      setUncontrolledCollapsed(next);
    }
    if (persistKey !== undefined) {
      try {
        window.localStorage.setItem(persistKey, next ? '1' : '0');
      } catch {
        // Storage can be unavailable (private mode); the choice then lasts for the session
      }
    }
    onToggle?.(next);
  };

  return (
    <StyledNav
      isCollapsed={isCollapsed}
      data-collapsed={isCollapsed}
      className={className}
      style={style}
    >
      <StyledHead isCollapsed={isCollapsed}>
        {isCollapsed ? <Mark /> : (brand ?? <Wordmark />)}
      </StyledHead>
      {navGroups.map((group, groupIndex) => (
        <div key={group.label ?? groupIndex}>
          {groupIndex > 0 && <StyledDivider isCollapsed={isCollapsed} />}
          {group.label !== undefined && !isCollapsed && (
            <StyledSection>{group.label}</StyledSection>
          )}
          {group.items.map((item) => (
            <StyledItem
              key={item.id}
              to={item.href ?? '#'}
              isCollapsed={isCollapsed}
              aria-current={item.active === true ? 'page' : undefined}
              aria-label={isCollapsed ? item.label : undefined}
              data-tip={item.label}
              onClick={() => onSelect?.(item.id)}
            >
              {item.icon !== undefined && (
                <Icon name={item.icon} size={isCollapsed ? 20 : 18} />
              )}
              {!isCollapsed && <StyledLabel>{item.label}</StyledLabel>}
              {!isCollapsed && item.count !== undefined && (
                <StyledCount isActive={item.active === true}>
                  {item.count}
                </StyledCount>
              )}
            </StyledItem>
          ))}
        </div>
      ))}
      <StyledSpacer />
      {footer}
      {showToggle && (
        <StyledToggle
          type="button"
          isCollapsed={isCollapsed}
          aria-label={
            isCollapsed ? t`Expand navigation` : t`Collapse navigation`
          }
          aria-expanded={!isCollapsed}
          data-tip={t`Expand`}
          onClick={toggle}
        >
          <Icon name={isCollapsed ? 'chevron-right' : 'chevron-left'} />
          {!isCollapsed && <span>{t`Collapse`}</span>}
        </StyledToggle>
      )}
    </StyledNav>
  );
};
