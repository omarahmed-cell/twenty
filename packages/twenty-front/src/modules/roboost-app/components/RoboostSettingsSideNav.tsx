import {
  getRoboostFormsSettingsPath,
  getRoboostRecordViewSettingsPath,
  ROBOOST_LAYOUT_SETTINGS_PATH,
} from '@/roboost-app/layout/utils/getRoboostLayoutSettingsPath';
import {
  getRoboostTeamsPath,
  getRoboostUsersPath,
  ROBOOST_USERS_AND_TEAMS_PATH,
} from '@/roboost-app/users-and-teams/utils/getRoboostUsersAndTeamsPath';
import { useRoboostAccess } from '@/roboost-app/users-and-teams/hooks/useRoboostAccess';
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
  labels: { forms: string; recordView: string; showForms: boolean },
): NavItem[] => {
  const formsPath = getRoboostFormsSettingsPath();
  const recordViewPath = getRoboostRecordViewSettingsPath();

  return [
    {
      id: ROBOOST_LAYOUT_SETTINGS_PATH,
      label: item.label,
      iconNode: <item.Icon size={18} stroke={1.75} />,
      href: labels.showForms ? formsPath : recordViewPath,
      active: false,
    },
    ...(labels.showForms
      ? [
          {
            id: formsPath,
            label: labels.forms,
            icon: 'list' as const,
            href: formsPath,
            active: pathname.startsWith(formsPath),
            isIndented: true,
          },
        ]
      : []),
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

// Settings → Users & Teams has its two tabs as sub-items too
const toUsersAndTeamsNavItems = (
  item: SettingsNavigationItem,
  pathname: string,
  labels: { users: string; teams: string },
): NavItem[] => {
  const usersPath = getRoboostUsersPath();
  const teamsPath = getRoboostTeamsPath();

  return [
    {
      id: ROBOOST_USERS_AND_TEAMS_PATH,
      label: item.label,
      iconNode: <item.Icon size={18} stroke={1.75} />,
      href: usersPath,
      active: false,
    },
    {
      id: usersPath,
      label: labels.users,
      icon: 'user',
      href: usersPath,
      active:
        pathname.startsWith(usersPath) ||
        pathname.startsWith(`${ROBOOST_USERS_AND_TEAMS_PATH}/compare`),
      isIndented: true,
    },
    {
      id: teamsPath,
      label: labels.teams,
      icon: 'contacts',
      href: teamsPath,
      active: pathname.startsWith(teamsPath),
      isIndented: true,
    },
  ];
};

type SettingsNavLabels = {
  forms: string;
  recordView: string;
  showForms: boolean;
  users: string;
  teams: string;
};

const toNavItems = (
  items: SettingsNavigationItem[],
  pathname: string,
  labels: SettingsNavLabels,
  isIndented = false,
): NavItem[] =>
  items
    .filter((item) => item.isHidden !== true)
    .flatMap((item) => {
      if (item.path === SettingsPath.Layout && item.isNoPermission !== true) {
        return toLayoutNavItems(item, pathname, labels);
      }
      if (
        item.path === SettingsPath.WorkspaceMembersPage &&
        item.isNoPermission !== true
      ) {
        return toUsersAndTeamsNavItems(item, pathname, labels);
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
        isNoPermission: item.isNoPermission,
        onClick: item.onClick,
      };

      return [
        navItem,
        ...(item.isNoPermission === true
          ? []
          : toNavItems(item.subItems ?? [], pathname, labels, true)),
      ];
    });

// Settings keeps its own sections; they are always shown with labels because there are many of them
export const RoboostSettingsSideNav = () => {
  const { t } = useLingui();
  const { pathname } = useLocation();
  const sections = useSettingsNavigationItems();
  const roboostAccess = useRoboostAccess();

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
        showForms: roboostAccess.isAdmin || !roboostAccess.isLoaded,
        users: t`Users`,
        teams: t`Teams`,
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
