import { lazy, Suspense } from 'react';
import { RoboostLayoutSettingsPage } from '@/roboost-app/layout/components/RoboostLayoutSettingsPage';
import { RoboostUsersAndTeamsPage } from '@/roboost-app/users-and-teams/components/RoboostUsersAndTeamsPage';
import { RoboostEditPermissionsPage } from '@/roboost-app/users-and-teams/components/RoboostEditPermissionsPage';
import { RoboostCompareAccessPage } from '@/roboost-app/users-and-teams/components/RoboostCompareAccessPage';
import {
  createRoutesFromElements,
  Navigate,
  Outlet,
  type Params,
  Route,
  useLocation,
  useParams,
} from 'react-router-dom';

import {
  type WorkspaceRouteHandle,
  type WorkspaceRouteObject,
} from '@/app/routing/types/WorkspaceRouteObject';
import { SETTINGS_AI_TABS } from '@/settings/ai/constants/SettingsAiTabs';
import { SettingsProtectedRouteWrapper } from '@/settings/components/SettingsProtectedRouteWrapper';
import { SettingsSkeletonLoader } from '@/settings/components/SettingsSkeletonLoader';
import { SettingPublicDomain } from '@/settings/domains/components/SettingPublicDomain';
import { SETTINGS_PIPELINE_PATHS } from '@/settings/data-model/pipelines/constants/SettingsPipelinePaths';
import { SettingsPath } from 'twenty-shared/types';
import { getSettingsPath } from 'twenty-shared/utils';
import { PermissionFlagType } from '~/generated-metadata/graphql';

const SettingsGraphQLPlayground = lazy(() =>
  import('~/pages/settings/developers/playground/SettingsGraphQLPlayground').then(
    (module) => ({
      default: module.SettingsGraphQLPlayground,
    }),
  ),
);

const SettingsRestPlayground = lazy(() =>
  import('~/pages/settings/developers/playground/SettingsRestPlayground').then(
    (module) => ({
      default: module.SettingsRestPlayground,
    }),
  ),
);

// TODO: remove these legacy redirects after 2027-01-14.
const LEGACY_DEVELOPERS_SETTINGS_PATH_PREFIX = 'mcp-apis';

const LEGACY_DEVELOPERS_SETTINGS_PATHS = [
  { suffix: '', to: SettingsPath.Developers },
  { suffix: '/apis/new', to: SettingsPath.NewApiKey },
  { suffix: '/apis/:apiKeyId', to: SettingsPath.ApiKeyDetail },
  { suffix: '/webhooks/new', to: SettingsPath.NewWebhook },
  { suffix: '/webhooks/:webhookId', to: SettingsPath.WebhookDetail },
] as const;

const LEGACY_APPLICATION_REGISTRATION_DETAIL_PATH =
  'applications/registrations/:applicationRegistrationId';

type LegacySettingsPathRedirectProps = {
  to:
    | (typeof LEGACY_DEVELOPERS_SETTINGS_PATHS)[number]['to']
    | SettingsPath.ApplicationRegistrationDetail;
};

const getLegacySettingsPathRedirectPathname = (
  to: LegacySettingsPathRedirectProps['to'],
  params: Readonly<Params<string>>,
) => {
  switch (to) {
    case SettingsPath.ApiKeyDetail:
      return getSettingsPath(SettingsPath.ApiKeyDetail, {
        apiKeyId: params.apiKeyId ?? null,
      });
    case SettingsPath.WebhookDetail:
      return getSettingsPath(SettingsPath.WebhookDetail, {
        webhookId: params.webhookId ?? null,
      });
    case SettingsPath.ApplicationRegistrationDetail:
      return getSettingsPath(SettingsPath.ApplicationRegistrationDetail, {
        applicationRegistrationId: params.applicationRegistrationId ?? null,
      });
    case SettingsPath.Developers:
    case SettingsPath.NewApiKey:
    case SettingsPath.NewWebhook:
      return getSettingsPath(to);
  }
};

function LegacySettingsPathRedirect({ to }: LegacySettingsPathRedirectProps) {
  const location = useLocation();
  const params = useParams();

  if (to === SettingsPath.Developers && location.hash === '#mcp') {
    return (
      <Navigate
        to={`${getSettingsPath(SettingsPath.AI)}${location.search}#${SETTINGS_AI_TABS.TABS_IDS.MCP}`}
        replace
      />
    );
  }

  const pathname = getLegacySettingsPathRedirectPathname(to, params);

  return (
    <Navigate to={`${pathname}${location.search}${location.hash}`} replace />
  );
}

const SettingsAccountsConfiguration = lazy(() =>
  import('~/pages/settings/accounts/SettingsAccountsConfiguration').then(
    (module) => ({
      default: module.SettingsAccountsConfiguration,
    }),
  ),
);

const SettingsNewAccount = lazy(() =>
  import('~/pages/settings/accounts/SettingsNewAccount').then((module) => ({
    default: module.SettingsNewAccount,
  })),
);

const SettingsNewObject = lazy(() =>
  import('~/pages/settings/data-model/SettingsNewObject').then((module) => ({
    default: module.SettingsNewObject,
  })),
);

const SettingsNewImapSmtpCaldavConnection = lazy(() =>
  import('~/pages/settings/accounts/SettingsAccountsNewImapSmtpCaldavConnection').then(
    (module) => ({
      default: module.SettingsAccountsNewImapSmtpCaldavConnection,
    }),
  ),
);

const SettingsEditImapSmtpCaldavConnection = lazy(() =>
  import('~/pages/settings/accounts/SettingsAccountsEditImapSmtpCaldavConnection').then(
    (module) => ({
      default: module.SettingsAccountsEditImapSmtpCaldavConnection,
    }),
  ),
);

const SettingsNewEmailGroupChannel = lazy(() =>
  import('~/pages/settings/accounts/SettingsAccountsNewEmailGroupChannel').then(
    (module) => ({
      default: module.SettingsAccountsNewEmailGroupChannel,
    }),
  ),
);

const SettingsObjectDetailPage = lazy(() =>
  import('~/pages/settings/data-model/SettingsObjectDetailPage').then(
    (module) => ({
      default: module.SettingsObjectDetailPage,
    }),
  ),
);

const SettingsObjectOverview = lazy(() =>
  import('~/pages/settings/data-model/SettingsObjectOverview').then(
    (module) => ({
      default: module.SettingsObjectOverview,
    }),
  ),
);

const SettingsProperties = lazy(() =>
  import('~/pages/settings/data-model/SettingsProperties').then((module) => ({
    default: module.SettingsProperties,
  })),
);

const SettingsDevelopersApiKeyDetail = lazy(() =>
  import('~/pages/settings/developers/api-keys/SettingsDevelopersApiKeyDetail').then(
    (module) => ({
      default: module.SettingsDevelopersApiKeyDetail,
    }),
  ),
);

const SettingsDevelopersApiKeysNew = lazy(() =>
  import('~/pages/settings/developers/api-keys/SettingsDevelopersApiKeysNew').then(
    (module) => ({
      default: module.SettingsDevelopersApiKeysNew,
    }),
  ),
);

const SettingsLogicFunctionDetail = lazy(() =>
  import('~/pages/settings/logic-functions/SettingsLogicFunctionDetail').then(
    (module) => ({
      default: module.SettingsLogicFunctionDetail,
    }),
  ),
);

const SettingsGeneral = lazy(() =>
  import('~/pages/settings/general/SettingsGeneral').then((module) => ({
    default: module.SettingsGeneral,
  })),
);

const SettingsLegalDpa = lazy(() =>
  import('~/pages/settings/legal/SettingsLegalDpa').then((module) => ({
    default: module.SettingsLegalDpa,
  })),
);

const SettingsLegalDpaNew = lazy(() =>
  import('~/pages/settings/legal/SettingsLegalDpaNew').then((module) => ({
    default: module.SettingsLegalDpaNew,
  })),
);

const SettingsWorkspaceCommunications = lazy(() =>
  import('~/pages/settings/communications/SettingsWorkspaceCommunications').then(
    (module) => ({
      default: module.SettingsWorkspaceCommunications,
    }),
  ),
);

const SettingsWorkspaceCommunicationGroupChannelDetail = lazy(() =>
  import('~/pages/settings/communications/SettingsWorkspaceCommunicationGroupChannelDetail').then(
    (module) => ({
      default: module.SettingsWorkspaceCommunicationGroupChannelDetail,
    }),
  ),
);

const SettingsWorkspaceNewUnsubscribeTopic = lazy(() =>
  import('~/pages/settings/communications/SettingsWorkspaceNewUnsubscribeTopic').then(
    (module) => ({
      default: module.SettingsWorkspaceNewUnsubscribeTopic,
    }),
  ),
);

const SettingsWorkspaceUnsubscribeTopicDetail = lazy(() =>
  import('~/pages/settings/communications/SettingsWorkspaceUnsubscribeTopicDetail').then(
    (module) => ({
      default: module.SettingsWorkspaceUnsubscribeTopicDetail,
    }),
  ),
);

const SettingsWorkspaceUnsubscribe = lazy(() =>
  import('~/pages/settings/communications/SettingsWorkspaceUnsubscribe').then(
    (module) => ({
      default: module.SettingsWorkspaceUnsubscribe,
    }),
  ),
);

const SettingsSubdomainPage = lazy(() =>
  import('~/pages/settings/domains/SettingsSubdomainPage').then((module) => ({
    default: module.SettingsSubdomainPage,
  })),
);

const SettingsCustomDomainPage = lazy(() =>
  import('~/pages/settings/domains/SettingsCustomDomainPage').then(
    (module) => ({
      default: module.SettingsCustomDomainPage,
    }),
  ),
);

const SettingsDevelopers = lazy(() =>
  import('~/pages/settings/developers/SettingsDevelopers').then((module) => ({
    default: module.SettingsDevelopers,
  })),
);

const SettingsAI = lazy(() =>
  import('~/pages/settings/ai/SettingsAI').then((module) => ({
    default: module.SettingsAI,
  })),
);

const SettingsAiUsageUserDetail = lazy(() =>
  import('~/pages/settings/ai/SettingsAiUsageUserDetail').then((module) => ({
    default: module.SettingsAiUsageUserDetail,
  })),
);

const SettingsToolDetail = lazy(() =>
  import('~/pages/settings/ai/SettingsToolDetail').then((module) => ({
    default: module.SettingsToolDetail,
  })),
);

const SettingsApplications = lazy(() =>
  import('~/pages/settings/applications/SettingsApplications').then(
    (module) => ({
      default: module.SettingsApplications,
    }),
  ),
);

const SettingsApplicationDetails = lazy(() =>
  import('~/pages/settings/applications/SettingsApplicationDetails').then(
    (module) => ({
      default: module.SettingsApplicationDetails,
    }),
  ),
);

const SettingsApplicationConnectionDetail = lazy(() =>
  import('~/pages/settings/applications/SettingsApplicationConnectionDetail').then(
    (module) => ({
      default: module.SettingsApplicationConnectionDetail,
    }),
  ),
);

const SettingsApplicationFrontComponentDetail = lazy(() =>
  import('~/pages/settings/applications/SettingsApplicationFrontComponentDetail').then(
    (module) => ({
      default: module.SettingsApplicationFrontComponentDetail,
    }),
  ),
);

const SettingsApplicationCommandMenuItemDetail = lazy(() =>
  import('~/pages/settings/applications/SettingsApplicationCommandMenuItemDetail').then(
    (module) => ({
      default: module.SettingsApplicationCommandMenuItemDetail,
    }),
  ),
);

const SettingsApplicationTimelineActivityTypeDetail = lazy(() =>
  import('~/pages/settings/applications/SettingsApplicationTimelineActivityTypeDetail').then(
    (module) => ({
      default: module.SettingsApplicationTimelineActivityTypeDetail,
    }),
  ),
);

const SettingsLayout = lazy(() =>
  import('~/pages/settings/layout/SettingsLayout').then((module) => ({
    default: module.SettingsLayout,
  })),
);

const SettingsLayoutViewDetail = lazy(() =>
  import('~/pages/settings/layout/SettingsLayoutViewDetail').then((module) => ({
    default: module.SettingsLayoutViewDetail,
  })),
);

const SettingsLayoutPageLayoutDetail = lazy(() =>
  import('~/pages/settings/layout/SettingsLayoutPageLayoutDetail').then(
    (module) => ({
      default: module.SettingsLayoutPageLayoutDetail,
    }),
  ),
);

const SettingsAdminApplicationRegistrationDetail = lazy(() =>
  import('~/pages/settings/admin-panel/SettingsAdminApplicationRegistrationDetail').then(
    (module) => ({
      default: module.SettingsAdminApplicationRegistrationDetail,
    }),
  ),
);

const SettingsAvailableApplicationDetails = lazy(() =>
  import('~/pages/settings/applications/SettingsAvailableApplicationDetails').then(
    (module) => ({
      default: module.SettingsAvailableApplicationDetails,
    }),
  ),
);

const SettingsApplicationRegistrationDetails = lazy(() =>
  import('~/pages/settings/applications/SettingsApplicationRegistrationDetails').then(
    (module) => ({
      default: module.SettingsApplicationRegistrationDetails,
    }),
  ),
);

const SettingsSkillForm = lazy(() =>
  import('~/pages/settings/ai/SettingsSkillForm').then((module) => ({
    default: module.SettingsSkillForm,
  })),
);

const SettingsAiPrompts = lazy(() =>
  import('~/pages/settings/ai/SettingsAiPrompts').then((module) => ({
    default: module.SettingsAiPrompts,
  })),
);

const SettingsProfile = lazy(() =>
  import('~/pages/settings/profile/SettingsProfile').then((module) => ({
    default: module.SettingsProfile,
  })),
);

const SettingsTwoFactorAuthenticationMethod = lazy(() =>
  import('~/pages/settings/profile/SettingsTwoFactorAuthenticationMethod').then(
    (module) => ({
      default: module.SettingsTwoFactorAuthenticationMethod,
    }),
  ),
);

const SettingsRoboostDuplicates = lazy(() =>
  import('~/pages/settings/data-management/SettingsRoboostDuplicates').then(
    (module) => ({
      default: module.SettingsRoboostDuplicates,
    }),
  ),
);

const SettingsRoboostImportExport = lazy(() =>
  import('~/pages/settings/data-management/SettingsRoboostImportExport').then(
    (module) => ({
      default: module.SettingsRoboostImportExport,
    }),
  ),
);

const SettingsRoboostCurrencies = lazy(() =>
  import('~/pages/settings/data-management/SettingsRoboostCurrencies').then(
    (module) => ({
      default: module.SettingsRoboostCurrencies,
    }),
  ),
);

const SettingsRoboostNotifications = lazy(() =>
  import('~/pages/settings/notifications/SettingsRoboostNotifications').then(
    (module) => ({
      default: module.SettingsRoboostNotifications,
    }),
  ),
);

const SettingsGmailExtension = lazy(() =>
  import('~/pages/settings/gmail-extension/SettingsGmailExtension').then(
    (module) => ({
      default: module.SettingsGmailExtension,
    }),
  ),
);

const SettingsExperience = lazy(() =>
  import('~/pages/settings/profile/appearance/components/SettingsExperience').then(
    (module) => ({
      default: module.SettingsExperience,
    }),
  ),
);

const SettingsAccounts = lazy(() =>
  import('~/pages/settings/accounts/SettingsAccounts').then((module) => ({
    default: module.SettingsAccounts,
  })),
);

const SettingsAccountDetail = lazy(() =>
  import('~/pages/settings/accounts/SettingsAccountDetail').then((module) => ({
    default: module.SettingsAccountDetail,
  })),
);

const SettingsNativeAccountApp = lazy(() =>
  import('~/pages/settings/accounts/SettingsNativeAccountApp').then(
    (module) => ({
      default: module.SettingsNativeAccountApp,
    }),
  ),
);

const SettingsAccountsEmails = lazy(() =>
  import('~/pages/settings/accounts/SettingsAccountsEmails').then((module) => ({
    default: module.SettingsAccountsEmails,
  })),
);

const SettingsAccountsCalendars = lazy(() =>
  import('~/pages/settings/accounts/SettingsAccountsCalendars').then(
    (module) => ({
      default: module.SettingsAccountsCalendars,
    }),
  ),
);

const SettingsBilling = lazy(() =>
  import('~/pages/settings/billing/SettingsBilling').then((module) => ({
    default: module.SettingsBilling,
  })),
);

const SettingsBillingPlans = lazy(() =>
  import('~/pages/settings/billing/SettingsBillingPlans').then((module) => ({
    default: module.SettingsBillingPlans,
  })),
);

const SettingsUsage = lazy(() =>
  import('~/pages/settings/billing/SettingsUsage').then((module) => ({
    default: module.SettingsUsage,
  })),
);

const SettingsBillingLimits = lazy(() =>
  import('~/pages/settings/billing/SettingsBillingLimits').then((module) => ({
    default: module.SettingsBillingLimits,
  })),
);

const SettingsBillingNewLimit = lazy(() =>
  import('~/pages/settings/billing/SettingsBillingNewLimit').then((module) => ({
    default: module.SettingsBillingNewLimit,
  })),
);

const SettingsBillingLimitEdit = lazy(() =>
  import('~/pages/settings/billing/SettingsBillingLimitEdit').then(
    (module) => ({
      default: module.SettingsBillingLimitEdit,
    }),
  ),
);

const SettingsUsageUserDetail = lazy(() =>
  import('~/pages/settings/billing/SettingsUsageUserDetail').then((module) => ({
    default: module.SettingsUsageUserDetail,
  })),
);

const SettingsObjects = lazy(() =>
  import('~/pages/settings/data-model/SettingsObjects').then((module) => ({
    default: module.SettingsObjects,
  })),
);

const SettingsDevelopersWebhookNew = lazy(() =>
  import('~/pages/settings/developers/webhooks/components/SettingsDevelopersWebhookNew').then(
    (module) => ({
      default: module.SettingsDevelopersWebhookNew,
    }),
  ),
);

const SettingsDevelopersWebhookDetail = lazy(() =>
  import('~/pages/settings/developers/webhooks/components/SettingsDevelopersWebhookDetail').then(
    (module) => ({
      default: module.SettingsDevelopersWebhookDetail,
    }),
  ),
);

const SettingsObjectNewFieldSelect = lazy(() =>
  import('~/pages/settings/data-model/new-field/SettingsObjectNewFieldSelect').then(
    (module) => ({
      default: module.SettingsObjectNewFieldSelect,
    }),
  ),
);

const SettingsObjectNewFieldConfigure = lazy(() =>
  import('~/pages/settings/data-model/new-field/SettingsObjectNewFieldConfigure').then(
    (module) => ({
      default: module.SettingsObjectNewFieldConfigure,
    }),
  ),
);

const SettingsObjectNewIndex = lazy(() =>
  import('~/pages/settings/data-model/new-index/SettingsObjectNewIndex').then(
    (module) => ({
      default: module.SettingsObjectNewIndex,
    }),
  ),
);

const SettingsObjectValidationRuleEdit = lazy(() =>
  import('~/pages/settings/data-model/validation-rules/SettingsObjectValidationRuleEdit').then(
    (module) => ({
      default: module.SettingsObjectValidationRuleEdit,
    }),
  ),
);

const SettingsObjectFieldEdit = lazy(() =>
  import('~/pages/settings/data-model/SettingsObjectFieldEdit').then(
    (module) => ({
      default: module.SettingsObjectFieldEdit,
    }),
  ),
);

const SettingsObjectSearch = lazy(() =>
  import('~/pages/settings/data-model/SettingsObjectSearch').then((module) => ({
    default: module.SettingsObjectSearch,
  })),
);

const SettingsObjectPipelineDetail = lazy(() =>
  import('~/pages/settings/data-model/SettingsObjectPipelineDetail').then(
    (module) => ({
      default: module.SettingsObjectPipelineDetail,
    }),
  ),
);

const SettingsObjectNewPipeline = lazy(() =>
  import('~/pages/settings/data-model/SettingsObjectNewPipeline').then(
    (module) => ({
      default: module.SettingsObjectNewPipeline,
    }),
  ),
);

const SettingsObjectIndexes = lazy(() =>
  import('~/pages/settings/data-model/SettingsObjectIndexes').then(
    (module) => ({
      default: module.SettingsObjectIndexes,
    }),
  ),
);

const SettingsObjectTranslations = lazy(() =>
  import('~/pages/settings/data-model/SettingsObjectTranslations').then(
    (module) => ({
      default: module.SettingsObjectTranslations,
    }),
  ),
);

const SettingsSecuritySsoIdentifyProvider = lazy(() =>
  import('~/pages/settings/security/SettingsSecuritySsoIdentifyProvider').then(
    (module) => ({
      default: module.SettingsSecuritySsoIdentifyProvider,
    }),
  ),
);

const SettingsSecurityApprovedAccessDomain = lazy(() =>
  import('~/pages/settings/security/SettingsSecurityApprovedAccessDomain').then(
    (module) => ({
      default: module.SettingsSecurityApprovedAccessDomain,
    }),
  ),
);

const SettingsAdmin = lazy(() =>
  import('~/pages/settings/admin-panel/SettingsAdmin').then((module) => ({
    default: module.SettingsAdmin,
  })),
);

const SettingsAdminIndicatorHealthStatus = lazy(() =>
  import('~/pages/settings/admin-panel/SettingsAdminIndicatorHealthStatus').then(
    (module) => ({
      default: module.SettingsAdminIndicatorHealthStatus,
    }),
  ),
);

const SettingsAdminInferredVersion = lazy(() =>
  import('~/pages/settings/admin-panel/SettingsAdminInferredVersion').then(
    (module) => ({
      default: module.SettingsAdminInferredVersion,
    }),
  ),
);

const SettingsAdminInstanceStatus = lazy(() =>
  import('~/pages/settings/admin-panel/SettingsAdminInstanceStatus').then(
    (module) => ({
      default: module.SettingsAdminInstanceStatus,
    }),
  ),
);

const SettingsAdminWorkspacesStatus = lazy(() =>
  import('~/pages/settings/admin-panel/SettingsAdminWorkspacesStatus').then(
    (module) => ({
      default: module.SettingsAdminWorkspacesStatus,
    }),
  ),
);

const SettingsAdminQueueDetail = lazy(() =>
  import('~/pages/settings/admin-panel/SettingsAdminQueueDetail').then(
    (module) => ({
      default: module.SettingsAdminQueueDetail,
    }),
  ),
);

const SettingsAdminConfigVariableDetails = lazy(() =>
  import('~/pages/settings/admin-panel/SettingsAdminConfigVariableDetails').then(
    (module) => ({
      default: module.SettingsAdminConfigVariableDetails,
    }),
  ),
);

const SettingsAdminNewAiProvider = lazy(() =>
  import('~/pages/settings/admin-panel/SettingsAdminNewAiProvider').then(
    (module) => ({
      default: module.SettingsAdminNewAiProvider,
    }),
  ),
);

const SettingsAdminAiProviderDetail = lazy(() =>
  import('~/pages/settings/admin-panel/SettingsAdminAiProviderDetail').then(
    (module) => ({
      default: module.SettingsAdminAiProviderDetail,
    }),
  ),
);

const SettingsAdminNewAiModel = lazy(() =>
  import('~/pages/settings/admin-panel/SettingsAdminNewAiModel').then(
    (module) => ({
      default: module.SettingsAdminNewAiModel,
    }),
  ),
);

const SettingsAdminUserDetail = lazy(() =>
  import('~/pages/settings/admin-panel/SettingsAdminUserDetail').then(
    (module) => ({
      default: module.SettingsAdminUserDetail,
    }),
  ),
);

const SettingsAdminWorkspaceDetail = lazy(() =>
  import('~/pages/settings/admin-panel/SettingsAdminWorkspaceDetail').then(
    (module) => ({
      default: module.SettingsAdminWorkspaceDetail,
    }),
  ),
);

const SettingsAdminWorkspaceChatThread = lazy(() =>
  import('~/pages/settings/admin-panel/SettingsAdminWorkspaceChatThread').then(
    (module) => ({
      default: module.SettingsAdminWorkspaceChatThread,
    }),
  ),
);

const SettingsCommunity = lazy(() =>
  import('~/pages/settings/community/SettingsCommunity').then((module) => ({
    default: module.SettingsCommunity,
  })),
);

type CreateSettingsRouteObjectsArgs = {
  isAdminPageEnabled?: boolean;
};

type SettingsRouteHandle = WorkspaceRouteHandle;

const MAIN_AND_SIDE_PANEL_SETTINGS_ROUTE_HANDLE: SettingsRouteHandle = {
  workspaceSurfaces: ['main', 'side-panel'],
};

const EXPANDABLE_SETTINGS_ROUTE_HANDLE: SettingsRouteHandle = {
  ...MAIN_AND_SIDE_PANEL_SETTINGS_ROUTE_HANDLE,
  isLocationExpandableFromSidePanel: true,
};

const createSettingsRouteElements = ({
  isAdminPageEnabled,
}: CreateSettingsRouteObjectsArgs) => (
  <>
    <Route path={SettingsPath.ProfilePage} element={<SettingsProfile />} />
    <Route
      path={SettingsPath.TwoFactorAuthenticationStrategyConfig}
      element={<SettingsTwoFactorAuthenticationMethod />}
    />
    <Route path={SettingsPath.Experience} element={<SettingsExperience />} />
    <Route
      path="roboost-forms/*"
      element={<Navigate to="/settings/roboost-layout/forms" replace />}
    />
    <Route
      path="roboost-layout"
      element={<Navigate to="/settings/roboost-layout/forms" replace />}
    />
    <Route
      path="roboost-layout/forms/:objectNameSingular?"
      element={<RoboostLayoutSettingsPage tab="forms" />}
    />
    <Route
      path="roboost-layout/record-view/:objectNameSingular?"
      element={<RoboostLayoutSettingsPage tab="record-view" />}
    />
    <Route
      path="users-and-teams"
      element={<Navigate to="/settings/users-and-teams/users" replace />}
    />
    <Route
      path="users-and-teams/users"
      element={<RoboostUsersAndTeamsPage tab="users" />}
    />
    <Route
      path="users-and-teams/teams"
      element={<RoboostUsersAndTeamsPage tab="teams" />}
    />
    <Route
      path="users-and-teams/users/:workspaceMemberId/permissions"
      element={<RoboostEditPermissionsPage />}
    />
    <Route
      path="users-and-teams/compare/:firstWorkspaceMemberId/:secondWorkspaceMemberId"
      element={<RoboostCompareAccessPage />}
    />
    <Route
      path={SettingsPath.GmailExtension}
      element={<SettingsGmailExtension />}
    />
    <Route
      path={SettingsPath.Notifications}
      element={<SettingsRoboostNotifications />}
    />
    <Route
      path={SettingsPath.ImportExport}
      element={<SettingsRoboostImportExport />}
    />
    <Route
      path={SettingsPath.Duplicates}
      element={<SettingsRoboostDuplicates />}
    />
    <Route
      path={SettingsPath.Currencies}
      element={<SettingsRoboostCurrencies />}
    />
    <Route
      path={SettingsPath.DataManagement}
      element={
        <Navigate to={getSettingsPath(SettingsPath.ImportExport)} replace />
      }
    />
    <Route
      element={
        <SettingsProtectedRouteWrapper
          settingsPermission={PermissionFlagType.CONNECTED_ACCOUNTS}
        />
      }
    >
      <Route path={SettingsPath.Accounts} element={<SettingsAccounts />} />
      <Route
        path={SettingsPath.AccountDetail}
        element={<SettingsAccountDetail />}
      />
      <Route
        path={SettingsPath.NativeAccountApp}
        element={<SettingsNativeAccountApp />}
      />
      <Route
        path={SettingsPath.AccountsEmails}
        element={<SettingsAccountsEmails />}
      />
      <Route
        path={SettingsPath.AccountsCalendars}
        element={<SettingsAccountsCalendars />}
      />
      <Route path={SettingsPath.NewAccount} element={<SettingsNewAccount />} />
      <Route
        path={SettingsPath.AccountsConfiguration}
        element={<SettingsAccountsConfiguration />}
      />
      <Route
        path={SettingsPath.NewImapSmtpCaldavConnection}
        element={<SettingsNewImapSmtpCaldavConnection />}
      />
      <Route
        path={SettingsPath.EditImapSmtpCaldavConnection}
        element={<SettingsEditImapSmtpCaldavConnection />}
      />
    </Route>
    <Route
      element={
        <SettingsProtectedRouteWrapper
          settingsPermission={PermissionFlagType.WORKSPACE}
        />
      }
    >
      <Route path={SettingsPath.General} element={<SettingsGeneral />} />
      <Route
        path={SettingsPath.WorkspaceCommunications}
        element={<SettingsWorkspaceCommunications />}
      />
      <Route
        path={SettingsPath.NewEmailGroupChannel}
        element={<SettingsNewEmailGroupChannel />}
      />
      <Route
        path={SettingsPath.EmailGroupChannelDetail}
        element={<SettingsWorkspaceCommunicationGroupChannelDetail />}
      />
      <Route
        path={SettingsPath.NewUnsubscribeTopic}
        element={<SettingsWorkspaceNewUnsubscribeTopic />}
      />
      <Route
        path={SettingsPath.UnsubscribeTopicDetail}
        element={<SettingsWorkspaceUnsubscribeTopicDetail />}
      />
      <Route
        path={SettingsPath.Unsubscribe}
        element={<SettingsWorkspaceUnsubscribe />}
      />
      <Route path={SettingsPath.Billing} element={<SettingsBilling />} />
      <Route
        path={SettingsPath.BillingPlans}
        element={<SettingsBillingPlans />}
      />
      <Route path={SettingsPath.Usage} element={<SettingsUsage />} />
      <Route
        path={SettingsPath.UsageUserDetail}
        element={<SettingsUsageUserDetail />}
      />
      <Route
        path={SettingsPath.BillingLimits}
        element={<SettingsBillingLimits />}
      />
      <Route
        path={SettingsPath.BillingNewLimit}
        element={<SettingsBillingNewLimit />}
      />
      <Route
        path={SettingsPath.BillingLimitEdit}
        element={<SettingsBillingLimitEdit />}
      />
      <Route
        path={SettingsPath.Subdomain}
        element={<SettingsSubdomainPage />}
      />
      <Route
        path={SettingsPath.CustomDomain}
        element={<SettingsCustomDomainPage />}
      />
      <Route
        path={SettingsPath.ApplicationPublicDomainNew}
        element={<SettingPublicDomain />}
      />
      <Route
        path={SettingsPath.ApplicationPublicDomainDetail}
        element={<SettingPublicDomain />}
      />
      <Route path={SettingsPath.LegalDpa} element={<SettingsLegalDpa />} />
      <Route
        path={SettingsPath.LegalDpaNew}
        element={<SettingsLegalDpaNew />}
      />
    </Route>
    <Route
      element={
        <SettingsProtectedRouteWrapper
          settingsPermission={PermissionFlagType.AI_SETTINGS}
        />
      }
    >
      <Route path={SettingsPath.AI} element={<SettingsAI />} />
      <Route path={SettingsPath.AiPrompts} element={<SettingsAiPrompts />} />
      <Route
        path={SettingsPath.AiNewSkill}
        element={<SettingsSkillForm mode="create" />}
      />
      <Route
        path={SettingsPath.AiSkillDetail}
        element={<SettingsSkillForm mode="edit" />}
      />
      <Route
        path={SettingsPath.AiUsageUserDetail}
        element={<SettingsAiUsageUserDetail />}
      />
      <Route
        path={SettingsPath.AiToolDetail}
        element={<SettingsToolDetail />}
      />
      <Route
        path={SettingsPath.LogicFunctionDetail}
        element={<SettingsLogicFunctionDetail />}
      />
    </Route>
    <Route
      element={
        <SettingsProtectedRouteWrapper
          settingsPermission={PermissionFlagType.LAYOUTS}
        />
      }
    >
      <Route path={SettingsPath.Layout} element={<SettingsLayout />} />
    </Route>
    <Route
      path={SettingsPath.WorkspaceMembersPage}
      element={<Navigate to="/settings/users-and-teams/users" replace />}
    />
    <Route
      path={SettingsPath.WorkspaceMemberPage}
      element={<Navigate to="/settings/users-and-teams/users" replace />}
    />
    <Route
      element={
        <SettingsProtectedRouteWrapper
          settingsPermission={PermissionFlagType.DATA_MODEL}
        />
      }
    >
      <Route
        path={SettingsPath.Objects}
        element={<SettingsObjects />}
        handle={EXPANDABLE_SETTINGS_ROUTE_HANDLE}
      />
      <Route
        path={SettingsPath.ObjectOverview}
        element={<SettingsObjectOverview />}
        handle={EXPANDABLE_SETTINGS_ROUTE_HANDLE}
      />
      <Route
        path={SettingsPath.Properties}
        element={<SettingsProperties />}
        handle={EXPANDABLE_SETTINGS_ROUTE_HANDLE}
      />
      <Route
        path={SettingsPath.ObjectDetail}
        element={<SettingsObjectDetailPage />}
        handle={MAIN_AND_SIDE_PANEL_SETTINGS_ROUTE_HANDLE}
      />
      <Route
        path={SettingsPath.NewObject}
        element={<SettingsNewObject />}
        handle={MAIN_AND_SIDE_PANEL_SETTINGS_ROUTE_HANDLE}
      />
      <Route
        path={SettingsPath.ObjectNewFieldSelect}
        element={<SettingsObjectNewFieldSelect />}
        handle={MAIN_AND_SIDE_PANEL_SETTINGS_ROUTE_HANDLE}
      />
      <Route
        path={SettingsPath.ObjectNewFieldConfigure}
        element={<SettingsObjectNewFieldConfigure />}
        handle={MAIN_AND_SIDE_PANEL_SETTINGS_ROUTE_HANDLE}
      />
      <Route
        path={SettingsPath.ObjectNewIndex}
        element={<SettingsObjectNewIndex />}
        handle={MAIN_AND_SIDE_PANEL_SETTINGS_ROUTE_HANDLE}
      />
      <Route
        path={SettingsPath.ObjectValidationRuleEdit}
        element={<SettingsObjectValidationRuleEdit />}
        handle={MAIN_AND_SIDE_PANEL_SETTINGS_ROUTE_HANDLE}
      />
      <Route
        path={SettingsPath.ObjectFieldEdit}
        element={<SettingsObjectFieldEdit />}
        handle={MAIN_AND_SIDE_PANEL_SETTINGS_ROUTE_HANDLE}
      />
      <Route
        path={SettingsPath.ObjectTranslations}
        element={<SettingsObjectTranslations />}
        handle={MAIN_AND_SIDE_PANEL_SETTINGS_ROUTE_HANDLE}
      />
      <Route
        path={SettingsPath.ObjectSearch}
        element={<SettingsObjectSearch />}
        handle={MAIN_AND_SIDE_PANEL_SETTINGS_ROUTE_HANDLE}
      />
      <Route
        path={SettingsPath.ObjectIndexes}
        element={<SettingsObjectIndexes />}
        handle={MAIN_AND_SIDE_PANEL_SETTINGS_ROUTE_HANDLE}
      />
      <Route
        path={SettingsPath.ObjectFieldTranslations}
        element={<SettingsObjectTranslations />}
        handle={MAIN_AND_SIDE_PANEL_SETTINGS_ROUTE_HANDLE}
      />
      <Route
        path={SETTINGS_PIPELINE_PATHS.NEW}
        element={<SettingsObjectNewPipeline />}
        handle={MAIN_AND_SIDE_PANEL_SETTINGS_ROUTE_HANDLE}
      />
      <Route
        path={SETTINGS_PIPELINE_PATHS.DETAIL}
        element={<SettingsObjectPipelineDetail />}
        handle={MAIN_AND_SIDE_PANEL_SETTINGS_ROUTE_HANDLE}
      />
    </Route>
    {[
      SettingsPath.Roles,
      SettingsPath.RoleDetail,
      SettingsPath.RoleCreate,
      SettingsPath.RoleObjectLevel,
      SettingsPath.RoleAddObjectLevel,
    ].map((rolePath) => (
      <Route
        key={rolePath}
        path={rolePath}
        element={<Navigate to="/settings/users-and-teams/users" replace />}
      />
    ))}
    <Route
      element={
        <SettingsProtectedRouteWrapper
          settingsPermission={PermissionFlagType.API_KEYS_AND_WEBHOOKS}
        />
      }
    >
      {LEGACY_DEVELOPERS_SETTINGS_PATHS.map(({ suffix, to }) => (
        <Route
          key={suffix}
          path={`${LEGACY_DEVELOPERS_SETTINGS_PATH_PREFIX}${suffix}`}
          element={<LegacySettingsPathRedirect to={to} />}
        />
      ))}
      <Route path={SettingsPath.Developers} element={<SettingsDevelopers />} />
      <Route
        path={SettingsPath.ApplicationRegistrationDetail}
        element={<SettingsApplicationRegistrationDetails />}
      />
      <Route
        path={LEGACY_APPLICATION_REGISTRATION_DETAIL_PATH}
        element={
          <LegacySettingsPathRedirect
            to={SettingsPath.ApplicationRegistrationDetail}
          />
        }
      />
      <Route
        path={`${SettingsPath.GraphQLPlayground}`}
        element={<SettingsGraphQLPlayground />}
      />
      <Route
        path={`${SettingsPath.RestPlayground}/*`}
        element={<SettingsRestPlayground />}
      />
      <Route
        path={SettingsPath.NewApiKey}
        element={<SettingsDevelopersApiKeysNew />}
      />
      <Route
        path={SettingsPath.ApiKeyDetail}
        element={<SettingsDevelopersApiKeyDetail />}
      />
      <Route
        path={SettingsPath.NewWebhook}
        element={<SettingsDevelopersWebhookNew />}
      />
      <Route
        path={SettingsPath.WebhookDetail}
        element={<SettingsDevelopersWebhookDetail />}
      />
    </Route>

    <Route
      element={
        <SettingsProtectedRouteWrapper
          settingsPermission={PermissionFlagType.APPLICATIONS}
        />
      }
    >
      <Route
        path={SettingsPath.Applications}
        element={<SettingsApplications />}
      />
      <Route
        path={SettingsPath.ApplicationDetail}
        element={<SettingsApplicationDetails />}
      />
      <Route
        path={SettingsPath.ApplicationConnectionDetail}
        element={<SettingsApplicationConnectionDetail />}
      />
      <Route
        path={SettingsPath.AvailableApplicationDetail}
        element={<SettingsAvailableApplicationDetails />}
      />
      <Route
        path={SettingsPath.ApplicationLogicFunctionDetail}
        element={<SettingsLogicFunctionDetail />}
      />
      <Route
        path={SettingsPath.ApplicationFrontComponentDetail}
        element={<SettingsApplicationFrontComponentDetail />}
      />
      <Route
        path={SettingsPath.ApplicationCommandMenuItemDetail}
        element={<SettingsApplicationCommandMenuItemDetail />}
      />
      <Route
        path={SettingsPath.ApplicationTimelineActivityTypeDetail}
        element={<SettingsApplicationTimelineActivityTypeDetail />}
      />
      <Route
        path={SettingsPath.ApplicationViewDetail}
        element={<SettingsLayoutViewDetail />}
      />
      <Route
        path={SettingsPath.ApplicationPageLayoutDetail}
        element={<SettingsLayoutPageLayoutDetail />}
      />
    </Route>

    <Route
      path="security"
      element={<Navigate to={getSettingsPath(SettingsPath.Security)} replace />}
    />

    <Route
      element={
        <SettingsProtectedRouteWrapper
          settingsPermission={PermissionFlagType.SECURITY}
        />
      }
    >
      <Route
        path={SettingsPath.NewSsoIdentityProvider}
        element={<SettingsSecuritySsoIdentifyProvider />}
      />
      <Route
        path={SettingsPath.NewApprovedAccessDomain}
        element={<SettingsSecurityApprovedAccessDomain />}
      />
    </Route>

    {isAdminPageEnabled && (
      <>
        <Route path={SettingsPath.AdminPanel} element={<SettingsAdmin />} />
        <Route
          path={SettingsPath.Enterprise}
          element={
            <Navigate
              to={getSettingsPath(SettingsPath.AdminPanelOrganization)}
              replace
            />
          }
        />
        <Route
          path={SettingsPath.AdminPanelInferredVersion}
          element={<SettingsAdminInferredVersion />}
        />
        <Route
          path={SettingsPath.AdminPanelInstanceStatus}
          element={<SettingsAdminInstanceStatus />}
        />
        <Route
          path={SettingsPath.AdminPanelWorkspacesStatus}
          element={<SettingsAdminWorkspacesStatus />}
        />
        <Route
          path={SettingsPath.AdminPanelIndicatorHealthStatus}
          element={<SettingsAdminIndicatorHealthStatus />}
        />
        <Route
          path={SettingsPath.AdminPanelQueueDetail}
          element={<SettingsAdminQueueDetail />}
        />

        <Route
          path={SettingsPath.AdminPanelConfigVariableDetails}
          element={<SettingsAdminConfigVariableDetails />}
        />
        <Route
          path={SettingsPath.AdminPanelNewAiProvider}
          element={<SettingsAdminNewAiProvider />}
        />
        <Route
          path={SettingsPath.AdminPanelNewAiModel}
          element={<SettingsAdminNewAiModel />}
        />
        <Route
          path={SettingsPath.AdminPanelAiProviderDetail}
          element={<SettingsAdminAiProviderDetail />}
        />
        <Route
          path={SettingsPath.AdminPanelUserDetail}
          element={<SettingsAdminUserDetail />}
        />
        <Route
          path={SettingsPath.AdminPanelWorkspaceDetail}
          element={<SettingsAdminWorkspaceDetail />}
        />
        <Route
          path={SettingsPath.AdminPanelApplicationRegistrationDetail}
          element={<SettingsAdminApplicationRegistrationDetail />}
        />
        <Route
          path={SettingsPath.AdminPanelWorkspaceChatThread}
          element={<SettingsAdminWorkspaceChatThread />}
        />
      </>
    )}

    <Route
      element={
        <SettingsProtectedRouteWrapper
          settingsPermission={PermissionFlagType.WORKSPACE}
        />
      }
    >
      <Route path={SettingsPath.Community} element={<SettingsCommunity />} />
    </Route>
  </>
);

const removeGeneratedRouteIds = (
  routeObjects: WorkspaceRouteObject[],
): WorkspaceRouteObject[] =>
  routeObjects.map(({ id: _generatedId, children, ...routeObject }) => ({
    ...routeObject,
    children: children && removeGeneratedRouteIds(children),
  }));

export const createSettingsRouteObjects = (
  args: CreateSettingsRouteObjectsArgs,
): WorkspaceRouteObject[] =>
  removeGeneratedRouteIds(
    createRoutesFromElements(
      createSettingsRouteElements(args),
    ) as WorkspaceRouteObject[],
  );

export const SettingsRouteOutlet = () => (
  <Suspense fallback={<SettingsSkeletonLoader />}>
    <Outlet />
  </Suspense>
);
