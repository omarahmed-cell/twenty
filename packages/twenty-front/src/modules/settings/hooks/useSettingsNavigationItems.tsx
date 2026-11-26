import { SettingsPath } from 'twenty-shared/types';

import { useAuth } from '@/auth/hooks/useAuth';
import { currentUserState } from '@/auth/states/currentUserState';
import { currentWorkspaceMemberState } from '@/auth/states/currentWorkspaceMemberState';
import { billingState } from '@/client-config/states/billingState';
import { supportChatState } from '@/client-config/states/supportChatState';
import { useRoboostAccess } from '@/roboost-app/users-and-teams/hooks/useRoboostAccess';
import { permissionFlagMapSelector } from '@/settings/roles/states/permissionFlagMapSelector';
import { getDocumentationUrl } from '@/support/utils/getDocumentationUrl';
import { useIsFeatureEnabled } from '@/workspace/hooks/useIsFeatureEnabled';
import { type NavigationDrawerItemModifier } from '@/ui/navigation/navigation-drawer/types/NavigationDrawerItemModifier';
import { type NavigationDrawerItemIndentationLevel } from '@/ui/navigation/navigation-drawer/types/NavigationDrawerItemIndentationLevel';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { t } from '@lingui/core/macro';
import { isNonEmptyString } from '@sniptt/guards';
import {
  IconAppWindow,
  IconArrowMerge,
  IconBell,
  IconDatabase,
  IconFileImport,
  IconCoins,
  IconApps,
  IconAt,
  IconCalendarEvent,
  IconCode,
  IconColorSwatch,
  IconPuzzle,
  type IconComponent,
  IconCreditCard,
  IconDoorEnter,
  IconHelpCircle,
  IconHierarchy,
  IconListSearch,
  IconMail,
  IconMessage,
  IconMessageCircle,
  IconServer,
  IconSettings2,
  IconSparkles,
  IconUserCircle,
  IconUsers,
} from 'twenty-ui/icon';
import {
  FeatureFlagKey,
  PermissionFlagType,
} from '~/generated-metadata/graphql';
import { openUrlInNewTab } from '~/utils/openUrlInNewTab';

export type SettingsNavigationSection = {
  label: string;
  items: SettingsNavigationItem[];
};

export type SettingsNavigationItem = {
  label: string;
  path?: SettingsPath;
  onClick?: () => void;
  Icon: IconComponent;
  indentationLevel?: NavigationDrawerItemIndentationLevel;
  matchSubPages?: boolean;
  isHidden?: boolean;
  // Shown with the no-permission cursor and tooltip in the Roboost settings nav, hidden in the classic one
  isNoPermission?: boolean;
  subItems?: SettingsNavigationItem[];
  modifier?: NavigationDrawerItemModifier;
};

const useSettingsNavigationItems = (): SettingsNavigationSection[] => {
  const billing = useAtomStateValue(billingState);
  const { signOut } = useAuth();
  const supportChat = useAtomStateValue(supportChatState);
  const currentWorkspaceMember = useAtomStateValue(currentWorkspaceMemberState);

  const isBillingEnabled = billing?.isBillingEnabled ?? false;
  const currentUser = useAtomStateValue(currentUserState);
  const isAdminEnabled =
    (currentUser?.canImpersonate || currentUser?.canAccessFullAdminPanel) ??
    false;
  const isSupportChatConfigured =
    supportChat?.supportDriver === 'FRONT' &&
    isNonEmptyString(supportChat.supportFrontChatId);

  const permissionFlagMap = useAtomStateValue(permissionFlagMapSelector);
  const roboostAccess = useRoboostAccess();
  const isAppPreferencesEnabled = useIsFeatureEnabled(
    FeatureFlagKey.IS_APP_PREFERENCES_ENABLED,
  );
  const isUnifiedEmailEnabled = useIsFeatureEnabled(
    FeatureFlagKey.IS_UNIFIED_EMAIL_ENABLED,
  );
  const isUnifiedMeetingsEnabled = useIsFeatureEnabled(
    FeatureFlagKey.IS_UNIFIED_MEETINGS_ENABLED,
  );

  return [
    {
      label: t`User`,
      items: [
        {
          label: t`Profile`,
          path: SettingsPath.ProfilePage,
          Icon: IconUserCircle,
        },
        {
          label: t`Experience`,
          path: SettingsPath.Experience,
          Icon: IconColorSwatch,
        },
        {
          label: t`Notifications`,
          path: SettingsPath.Notifications,
          Icon: IconBell,
        },
        {
          label: t`Gmail extension`,
          path: SettingsPath.GmailExtension,
          Icon: IconPuzzle,
          isHidden: !isUnifiedEmailEnabled,
          isNoPermission: !roboostAccess.hasToggle('connectGoogle'),
        },
        {
          label: isAppPreferencesEnabled ? t`App preferences` : t`Accounts`,
          path: SettingsPath.Accounts,
          Icon: isAppPreferencesEnabled ? IconApps : IconAt,
          isNoPermission:
            !permissionFlagMap[PermissionFlagType.CONNECTED_ACCOUNTS],
          subItems: isAppPreferencesEnabled
            ? undefined
            : [
                {
                  label: t`Emails`,
                  path: SettingsPath.AccountsEmails,
                  Icon: IconMail,
                  isHidden:
                    isUnifiedEmailEnabled ||
                    !permissionFlagMap[PermissionFlagType.CONNECTED_ACCOUNTS],
                  indentationLevel: 2,
                },
                {
                  label: t`Calendars`,
                  path: SettingsPath.AccountsCalendars,
                  Icon: IconCalendarEvent,
                  isHidden:
                    isUnifiedMeetingsEnabled ||
                    !permissionFlagMap[PermissionFlagType.CONNECTED_ACCOUNTS],
                  indentationLevel: 2,
                },
              ],
        },
      ],
    },
    {
      label: t`Workspace`,
      items: [
        {
          label: t`General`,
          path: SettingsPath.General,
          Icon: IconSettings2,
          isNoPermission: !permissionFlagMap[PermissionFlagType.WORKSPACE],
        },
        {
          label: t`Data model`,
          path: SettingsPath.Objects,
          Icon: IconHierarchy,
          isNoPermission: !permissionFlagMap[PermissionFlagType.DATA_MODEL],
          subItems: [
            {
              label: t`Properties`,
              path: SettingsPath.Properties,
              Icon: IconListSearch,
              isNoPermission: !permissionFlagMap[PermissionFlagType.DATA_MODEL],
              indentationLevel: 2,
            },
          ],
        },
        {
          label: t`Data management`,
          path: SettingsPath.ImportExport,
          Icon: IconDatabase,
          isNoPermission: !permissionFlagMap[PermissionFlagType.WORKSPACE],
          subItems: [
            {
              label: t`Import & Export`,
              path: SettingsPath.ImportExport,
              Icon: IconFileImport,
              isNoPermission: !permissionFlagMap[PermissionFlagType.WORKSPACE],
              indentationLevel: 2,
            },
            {
              label: t`Duplicates`,
              path: SettingsPath.Duplicates,
              Icon: IconArrowMerge,
              isNoPermission: !permissionFlagMap[PermissionFlagType.WORKSPACE],
              indentationLevel: 2,
            },
            {
              label: t`Currencies`,
              path: SettingsPath.Currencies,
              Icon: IconCoins,
              isHidden: !roboostAccess.isLoaded,
              isNoPermission: !roboostAccess.isAdmin,
              indentationLevel: 2,
            },
          ],
        },
        {
          label: t`Layout`,
          path: SettingsPath.Layout,
          Icon: IconAppWindow,
          isNoPermission:
            !permissionFlagMap[PermissionFlagType.LAYOUTS] ||
            !roboostAccess.hasToggle('customizeCards'),
        },
        {
          label: t`Users & Teams`,
          path: SettingsPath.WorkspaceMembersPage,
          Icon: IconUsers,
          isHidden: !roboostAccess.isLoaded,
          isNoPermission: !roboostAccess.canSeeUserTable,
        },
        {
          label: t`Billing`,
          path: SettingsPath.Billing,
          Icon: IconCreditCard,
          isHidden: !isBillingEnabled,
          isNoPermission: !permissionFlagMap[PermissionFlagType.WORKSPACE],
        },
        {
          label: t`Developers`,
          path: SettingsPath.Developers,
          Icon: IconCode,
          isNoPermission:
            !permissionFlagMap[PermissionFlagType.API_KEYS_AND_WEBHOOKS],
        },
        // TODO: Re-enable when integrations page is ready
        // {
        //   label: t`Integrations`,
        //   path: SettingsPath.Integrations,
        //   Icon: IconApps,
        //   isNoPermission: !permissionFlagMap[PermissionFlagType.API_KEYS_AND_WEBHOOKS],
        // },
        {
          label: t`Apps`,
          path: SettingsPath.Applications,
          Icon: IconApps,
          isNoPermission: !permissionFlagMap[PermissionFlagType.APPLICATIONS],
        },
        {
          label: t`AI`,
          path: SettingsPath.AI,
          Icon: IconSparkles,
          isNoPermission: !permissionFlagMap[PermissionFlagType.AI_SETTINGS],
        },
        {
          label: t`Communication`,
          path: SettingsPath.WorkspaceCommunications,
          Icon: IconMessageCircle,
          isNoPermission: !permissionFlagMap[PermissionFlagType.WORKSPACE],
        },
      ],
    },
    {
      label: t`Other`,
      items: [
        {
          label: t`Admin Panel`,
          path: SettingsPath.AdminPanel,
          Icon: IconServer,
          isHidden: !isAdminEnabled,
        },
        {
          label: t`Community`,
          path: SettingsPath.Community,
          Icon: IconUsers,
          isNoPermission: !permissionFlagMap[PermissionFlagType.WORKSPACE],
        },
        {
          label: t`Support`,
          onClick: () => window.FrontChat?.('show'),
          Icon: IconMessage,
          isHidden: !isSupportChatConfigured,
        },
        {
          label: t`Documentation`,
          onClick: () =>
            openUrlInNewTab(
              getDocumentationUrl({ locale: currentWorkspaceMember?.locale }),
            ),
          Icon: IconHelpCircle,
        },
        {
          label: t`Logout`,
          onClick: signOut,
          Icon: IconDoorEnter,
          matchSubPages: false,
        },
      ],
    },
  ];
};

export { useSettingsNavigationItems };
