import { FrameLogo } from '@/roboost-ui/components/FrameLogo';
import { Icon } from '@/roboost-ui/components/Icon';
import { type RoboostIconName } from '@/roboost-ui/types/RoboostIconName';
import { cx } from '@/roboost-ui/utils/cx';
import { getRoboostNoPermissionAttribute } from '@/roboost-ui/utils/getRoboostNoPermissionAttributes';
import { useLingui } from '@lingui/react/macro';
import { type CSSProperties, Fragment, type ReactNode } from 'react';
import { Link } from 'react-router-dom';

export type NavItem = {
  id: string;
  label: string;
  icon?: RoboostIconName;
  // For icons outside the roboost set (for example Settings items)
  iconNode?: ReactNode;
  count?: number;
  active?: boolean;
  href?: string;
  isIndented?: boolean;
  isNoPermission?: boolean;
  onClick?: () => void;
};

export type NavGroup = { label?: string; items: NavItem[] };

export type SideNavProps = {
  items?: NavItem[];
  groups?: NavGroup[];
  hideBrand?: boolean;
  collapsed: boolean;
  onToggle?: (collapsed: boolean) => void;
  showToggle?: boolean;
  brand?: ReactNode;
  footer?: ReactNode;
  onSelect?: (id: string) => void;
  className?: string;
  style?: CSSProperties;
};

export const SideNav = ({
  items = [],
  groups,
  hideBrand = false,
  collapsed,
  onToggle,
  showToggle = true,
  brand,
  footer,
  onSelect,
  className,
  style,
}: SideNavProps) => {
  const { t } = useLingui();
  const navGroups = groups ?? [{ items }];

  return (
    <nav
      className={cx(
        'rb-nav',
        collapsed ? 'rb-nav-collapsed' : 'rb-nav-expanded',
        className,
      )}
      data-collapsed={collapsed}
      style={style}
    >
      {!hideBrand && (
        <div className="rb-nav-head">
          {brand ?? <FrameLogo collapsed={collapsed} />}
        </div>
      )}
      <div className="rb-nav-scroll">
        {navGroups.map((group, groupIndex) => (
          <Fragment key={group.label ?? groupIndex}>
            {groupIndex > 0 && <div className="rb-nav-divider" />}
            {group.label !== undefined && !collapsed && (
              <div className="rb-nav-section">{group.label}</div>
            )}
            {group.items.map((item) => (
              <Link
                key={item.id}
                to={item.href ?? '#'}
                className={cx(
                  'rb-nav-item',
                  item.isIndented === true && 'is-indented',
                )}
                aria-current={item.active === true ? 'page' : undefined}
                aria-label={collapsed ? item.label : undefined}
                data-tip={item.label}
                data-rb-no-permission={getRoboostNoPermissionAttribute(
                  item.isNoPermission !== true,
                )}
                aria-disabled={item.isNoPermission !== true ? undefined : true}
                onClick={(event) => {
                  if (item.onClick !== undefined) {
                    event.preventDefault();
                    item.onClick();
                  }
                  onSelect?.(item.id);
                }}
              >
                {item.icon !== undefined && (
                  <Icon name={item.icon} size={collapsed ? 20 : 18} />
                )}
                {item.icon === undefined && item.iconNode}
                {!collapsed && (
                  <span className="rb-nav-label">{item.label}</span>
                )}
                {!collapsed && item.count !== undefined && (
                  <span className="rb-nav-count">{item.count}</span>
                )}
              </Link>
            ))}
          </Fragment>
        ))}
      </div>
      <div className="rb-nav-spacer" />
      {footer}
      {showToggle && (
        <button
          type="button"
          className="rb-nav-toggle"
          aria-label={collapsed ? t`Expand navigation` : t`Collapse navigation`}
          aria-expanded={!collapsed}
          data-tip={t`Expand`}
          onClick={() => onToggle?.(!collapsed)}
        >
          <Icon name={collapsed ? 'chevron-right' : 'chevron-left'} />
          {!collapsed && <span>{t`Collapse`}</span>}
        </button>
      )}
    </nav>
  );
};
