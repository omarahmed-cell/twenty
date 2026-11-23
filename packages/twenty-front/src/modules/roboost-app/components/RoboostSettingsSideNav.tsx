import {
  getRoboostFormsSettingsPath,
  getRoboostRecordViewSettingsPath,
  ROBOOST_LAYOUT_SETTINGS_PATH,
} from '@/roboost-app/layout/utils/getRoboostLayoutSettingsPath';
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
import { SettingsPath } from 'twenty-shared/types';
import { getSettingsPath, isDefined } from 'twenty-shared/utils';

// Settings → Layout is the Roboost page (create forms and record views), with its two tabs as sub-items
const toLayoutNavItems = (
  item: SettingsNavigationItem,
  pathname: string,
  labels: { forms: string; recordView: string },
): NavItem[] => {
  const formsPath = getRoboostFormsSettingsPath();
  const recordViewPath = getRoboostRecordViewSettingsPath();

  return [
    {
      id: ROBOOST_LAYOUT_SETTINGS_PATH,
      label: item.label,
      iconNode: <item.Icon size={18} stroke={1.75} />,
      href: formsPath,
      active: false,
    },
    {
      id: formsPath,
      label: labels.forms,
      icon: 'list',
      href: formsPath,
      active: pathname.startsWith(formsPath),
      isIndented: true,
    },
    {
      id: recordViewPath,
      label: labels.recordView,
      icon: 'columns',
      href: recordViewPath,
      active: pathname.startsWith(recordViewPath),
      isIndented: true,
    },
  ];
};

const toNavItems = (
  items: SettingsNavigationItem[],
  pathname: string,
  labels: { forms: string; recordView: string },
  isIndented = false,
): NavItem[] =>
  items
    .filter((item) => item.isHidden !== true)
    .flatMap((item) => {
      if (item.path === SettingsPath.Layout) {
        return toLayoutNavItems(item, pathname, labels);
      }
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

      return [
        navItem,
        ...toNavItems(item.subItems ?? [], pathname, labels, true),
      ];
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

  const groups: NavGroup[] = [
    backGroup,
    ...sections.map((section) => ({
      label: section.label,
      items: toNavItems(section.items, pathname, {
        forms: t`Forms`,
        recordView: t`Record view`,
      }),
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
