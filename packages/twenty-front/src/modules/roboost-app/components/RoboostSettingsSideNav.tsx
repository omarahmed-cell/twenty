import { ROBOOST_LAYOUT_SETTINGS_PATH } from '@/roboost-app/layout/utils/getRoboostLayoutSettingsPath';
import {
  type NavGroup,
  type NavItem,
  SideNav,
} from '@/roboost-ui/components/SideNav';
import {
  type SettingsNavigationItem,
  useSettingsNavigationItems,
} from '@/settings/hooks/useSettingsNavigationItems';
import { useLingui } from '@lingui/react/macro';
import { useLocation } from 'react-router-dom';
import { getSettingsPath, isDefined } from 'twenty-shared/utils';

const toNavItems = (
  items: SettingsNavigationItem[],
  pathname: string,
  isIndented = false,
): NavItem[] =>
  items
    .filter((item) => item.isHidden !== true)
    .flatMap((item) => {
      const href = isDefined(item.path)
        ? getSettingsPath(item.path)
        : undefined;
      const isActive =
        isDefined(href) &&
        (pathname === href ||
          (item.matchSubPages !== false && pathname.startsWith(`${href}/`)));

      const navItem: NavItem = {
        id: href ?? item.label,
        label: item.label,
        iconNode: <item.Icon size={18} stroke={1.75} />,
        href,
        active: isActive,
        isIndented,
        onClick: item.onClick,
      };

      return [navItem, ...toNavItems(item.subItems ?? [], pathname, true)];
    });

// Settings keeps its own sections; they are always shown with labels because there are many of them
export const RoboostSettingsSideNav = () => {
  const { t } = useLingui();
  const { pathname } = useLocation();
  const sections = useSettingsNavigationItems();

  const backGroup: NavGroup = {
    items: [
      { id: 'back', label: t`Back to CRM`, icon: 'chevron-left', href: '/' },
    ],
  };

  const roboostGroup: NavGroup = {
    label: t`Roboost CRM`,
    items: [
      {
        id: 'roboost-layout',
        label: t`Layout`,
        icon: 'columns',
        href: ROBOOST_LAYOUT_SETTINGS_PATH,
        active: pathname.startsWith(ROBOOST_LAYOUT_SETTINGS_PATH),
      },
    ],
  };

  const groups: NavGroup[] = [
    backGroup,
    roboostGroup,
    ...sections.map((section) => ({
      label: section.label,
      items: toNavItems(section.items, pathname),
    })),
  ].filter((group) => group.items.length > 0);

  return (
    <SideNav
      groups={groups}
      collapsed={false}
      hideBrand
      showToggle={false}
      className="is-scrollable"
    />
  );
};
