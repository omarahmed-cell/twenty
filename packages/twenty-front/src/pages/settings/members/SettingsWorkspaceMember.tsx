import { useParams } from 'react-router-dom';
import { useDebouncedCallback } from 'use-debounce';

import { useImpersonationSession } from '@/auth/hooks/useImpersonationSession';
import { useFindOneRecord } from '@/object-record/hooks/useFindOneRecord';
import { SettingsPageContainer } from '@/settings/components/SettingsPageContainer';
import { SettingsPageLayout } from '@/settings/components/layout/SettingsPageLayout';
import { SettingsTabBar } from '@/settings/components/layout/SettingsTabBar';
import { SettingsRolesQueryEffect } from '@/settings/roles/components/SettingsRolesQueryEffect';
import { useHasPermissionFlag } from '@/settings/roles/hooks/useHasPermissionFlag';
import { ConfirmationDialog } from '@/ui/layout/dialog/components/ConfirmationDialog';
import { useDialog } from '@/ui/layout/dialog/hooks/useDialog';
import { activeTabIdComponentState } from '@/ui/layout/tab-list/states/activeTabIdComponentState';
import { useAtomComponentStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentStateValue';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { t } from '@lingui/core/macro';
import { CoreObjectNameSingular, SettingsPath } from 'twenty-shared/types';
import { getSettingsPath, isDefined } from 'twenty-shared/utils';
import { useToast } from 'twenty-ui/components/feedback';
import { IconInfoCircle, IconLock } from 'twenty-ui/icon';
import { useNavigateSettings } from '~/hooks/useNavigateSettings';

import { currentUserState } from '@/auth/states/currentUserState';
import { currentWorkspaceMemberState } from '@/auth/states/currentWorkspaceMemberState';
import { useUpdateWorkspaceMemberStatus } from '@/settings/members/hooks/useUpdateWorkspaceMemberStatus';
import { type WorkspaceMemberStatus } from '@/workspace-member/types/WorkspaceMemberStatus';
import { getWorkspaceMemberLabelWithStatus } from '@/workspace-member/utils/getWorkspaceMemberLabelWithStatus';
import { isWorkspaceMemberDeactivated } from '@/workspace-member/utils/isWorkspaceMemberDeactivated';
import { currentWorkspaceState } from '@/auth/states/currentWorkspaceState';
import { isImpersonatingState } from '@/auth/states/isImpersonatingState';
import { useUpdateOneRecord } from '@/object-record/hooks/useUpdateOneRecord';
import { MemberInfosTab } from '@/settings/members/components/MemberInfosTab';
import { MemberPermissionsTab } from '@/settings/members/components/MemberPermissionsTab';
import { useWorkspaceMemberRoles } from '@/settings/members/hooks/useWorkspaceMemberRoles';
import { type WorkspaceMember } from '@/workspace-member/types/WorkspaceMember';
import { useMutation } from '@apollo/client/react';
import {
  DeleteUserWorkspaceDocument,
  ImpersonateDocument,
  PermissionFlagType,
} from '~/generated-metadata/graphql';

const SETTINGS_WORKSPACE_MEMBER_TABS = {
  COMPONENT_INSTANCE_ID: 'settings-workspace-member-tabs',
  TABS_IDS: {
    INFOS: 'infos',
    PERMISSIONS: 'permissions',
  },
};

const DELETE_MEMBER_MODAL_ID = 'workspace-member-delete-modal';
const DEACTIVATE_MEMBER_MODAL_ID = 'workspace-member-deactivate-modal';

export const SettingsWorkspaceMember = () => {
  const { workspaceMemberId = '' } = useParams();
  const navigateSettings = useNavigateSettings();
  const { enqueueToast } = useToast();
  const { openDialog, closeDialog } = useDialog();
  const currentUser = useAtomStateValue(currentUserState);
  const currentWorkspaceMember = useAtomStateValue(currentWorkspaceMemberState);
  const { updateWorkspaceMemberStatus, loading: isUpdatingStatus } =
    useUpdateWorkspaceMemberStatus();
  const currentWorkspace = useAtomStateValue(currentWorkspaceState);
  const { startImpersonating } = useImpersonationSession();
  const [impersonate] = useMutation(ImpersonateDocument);
  const isImpersonating = useAtomStateValue(isImpersonatingState);
  const canImpersonate =
    useHasPermissionFlag(PermissionFlagType.IMPERSONATE) && !isImpersonating;
  const canManageTwoFactorAuthenticationRecovery =
    useHasPermissionFlag(PermissionFlagType.SECURITY) && !isImpersonating;

  const {
    roles,
    allRoles,
    loading: rolesLoading,
  } = useWorkspaceMemberRoles(workspaceMemberId);

  const {
    record: member,
    loading,
    refetch: refetchMember,
  } = useFindOneRecord<WorkspaceMember>({
    objectNameSingular: CoreObjectNameSingular.WorkspaceMember,
    objectRecordId: workspaceMemberId,
    recordGqlFields: {
      id: true,
      userId: true,
      name: { firstName: true, lastName: true },
      avatarUrl: true,
      userEmail: true,
      memberStatus: true,
      isPreCreated: true,
    },
  });

  const tabListComponentId = `${SETTINGS_WORKSPACE_MEMBER_TABS.COMPONENT_INSTANCE_ID}-${workspaceMemberId}`;
  const activeTabId = useAtomComponentStateValue(
    activeTabIdComponentState,
    tabListComponentId,
  );

  const { updateOneRecord } = useUpdateOneRecord();

  const [deleteUserFromWorkspace, { loading: isDeleting }] = useMutation(
    DeleteUserWorkspaceDocument,
  );

  const debouncedUpdateName = useDebouncedCallback(
    async (firstName: string, lastName: string) => {
      if (
        !member?.id ||
        firstName.trim().length < 1 ||
        lastName.trim().length < 1
      ) {
        return;
      }
      try {
        await updateOneRecord({
          objectNameSingular: CoreObjectNameSingular.WorkspaceMember,
          idToUpdate: member.id,
          updateOneRecordInput: {
            name: { firstName, lastName },
          },
        });
      } catch (error) {
        enqueueToast({
          status: 'error',
          children:
            error instanceof Error
              ? error.message
              : t`Error while saving the name`,
        });
      }
    },
    400,
  );

  const handleDeleteMember = async () => {
    if (!member?.id) return;
    try {
      await deleteUserFromWorkspace({
        variables: { workspaceMemberIdToDelete: member.id },
      });
      enqueueToast({
        status: 'success',
        children: t`Member removed from workspace`,
      });
      closeDialog(DELETE_MEMBER_MODAL_ID);
      navigateSettings(SettingsPath.WorkspaceMembersPage);
    } catch (error) {
      enqueueToast({
        status: 'error',
        children:
          error instanceof Error
            ? error.message
            : t`Unable to delete member right now`,
      });
    }
  };

  const handleUpdateMemberStatus = async (
    memberStatus: WorkspaceMemberStatus,
  ) => {
    if (!member?.id) return;
    try {
      await updateWorkspaceMemberStatus({
        workspaceMemberId: member.id,
        memberStatus,
      });
      await refetchMember();
      enqueueToast({
        status: 'success',
        children:
          memberStatus === 'DEACTIVATED'
            ? t`Member deactivated`
            : t`Member reactivated`,
      });
    } catch (error) {
      enqueueToast({
        status: 'error',
        children:
          error instanceof Error
            ? error.message
            : t`Unable to update member status right now`,
      });
    }
  };

  const handleImpersonate = async () => {
    if (!member?.userId || !currentWorkspace?.id) {
      enqueueToast({
        status: 'error',
        children: t`Cannot impersonate selected user`,
        duration: 2000,
      });
      return;
    }

    if (!isDefined(currentUser?.id) || member.userId === currentUser.id) {
      enqueueToast({
        status: 'error',
        children: t`You cannot impersonate your own account`,
        duration: 2000,
      });

      return;
    }

    await impersonate({
      variables: {
        userId: member.userId,
        workspaceId: currentWorkspace.id,
      },
      onCompleted: async (data) => {
        const { loginToken } = data.impersonate;

        await startImpersonating(loginToken.token);
      },
      onError: () => {
        enqueueToast({
          status: 'error',
          children: t`Cannot impersonate selected user`,
          duration: 2000,
        });
      },
    });
  };

  const isLoading = loading || rolesLoading || !member;

  const isCurrentWorkspaceMember =
    isDefined(member) && member.id === currentWorkspaceMember?.id;
  const isMemberDeactivated =
    isDefined(member) && isWorkspaceMemberDeactivated(member);
  const memberDisplayName = isDefined(member)
    ? getWorkspaceMemberLabelWithStatus({
        label: `${member.name.firstName} ${member.name.lastName}`,
        memberStatus: member.memberStatus,
      })
    : '';

  return (
    <>
      <SettingsRolesQueryEffect />
      {isLoading ? null : (
        <SettingsPageLayout
          title={memberDisplayName}
          links={[
            {
              children: t`Workspace`,
              href: getSettingsPath(SettingsPath.General),
            },
            {
              children: t`Members`,
              href: getSettingsPath(SettingsPath.WorkspaceMembersPage),
            },
            {
              children: memberDisplayName,
            },
          ]}
          secondaryBar={
            <SettingsTabBar
              aria-label={t`Member details`}
              tabs={[
                {
                  id: SETTINGS_WORKSPACE_MEMBER_TABS.TABS_IDS.INFOS,
                  title: t`Infos`,
                  Icon: IconInfoCircle,
                },
                {
                  id: SETTINGS_WORKSPACE_MEMBER_TABS.TABS_IDS.PERMISSIONS,
                  title: t`Permissions`,
                  Icon: IconLock,
                },
              ]}
              componentInstanceId={tabListComponentId}
            />
          }
        >
          <SettingsPageContainer>
            {activeTabId === SETTINGS_WORKSPACE_MEMBER_TABS.TABS_IDS.INFOS && (
              <MemberInfosTab
                member={member}
                onImpersonate={
                  canImpersonate &&
                  isDefined(member.userId) &&
                  isDefined(currentUser?.id) &&
                  member.userId !== currentUser.id
                    ? handleImpersonate
                    : undefined
                }
                onNameChange={debouncedUpdateName}
                onDelete={() => openDialog(DELETE_MEMBER_MODAL_ID)}
                onDeactivate={
                  !isCurrentWorkspaceMember && !isMemberDeactivated
                    ? () => openDialog(DEACTIVATE_MEMBER_MODAL_ID)
                    : undefined
                }
                onReactivate={
                  !isCurrentWorkspaceMember && isMemberDeactivated
                    ? () => handleUpdateMemberStatus('ACTIVE')
                    : undefined
                }
                twoFactorAuthenticationRecoveryUserId={
                  canManageTwoFactorAuthenticationRecovery &&
                  isDefined(member.userId) &&
                  isDefined(currentUser?.id) &&
                  member.userId !== currentUser.id
                    ? member.userId
                    : undefined
                }
              />
            )}

            {activeTabId ===
              SETTINGS_WORKSPACE_MEMBER_TABS.TABS_IDS.PERMISSIONS && (
              <MemberPermissionsTab
                member={member}
                roles={roles}
                allRoles={allRoles}
              />
            )}
          </SettingsPageContainer>

          <ConfirmationDialog
            dialogId={DELETE_MEMBER_MODAL_ID}
            title={t`Remove member from workspace`}
            subtitle={t`This action cannot be undone. This member will be removed and unassigned from their records. Their synced emails and calendars will stop syncing and be reassigned to you.`}
            onConfirmClick={handleDeleteMember}
            confirmButtonText={t`Remove member`}
            loading={isDeleting}
          />

          <ConfirmationDialog
            dialogId={DEACTIVATE_MEMBER_MODAL_ID}
            title={t`Deactivate member`}
            subtitle={t`This member will no longer be able to sign in and won't be offered for new assignments. Records already assigned to them keep showing them.`}
            onConfirmClick={() => handleUpdateMemberStatus('DEACTIVATED')}
            confirmButtonText={t`Deactivate member`}
            loading={isUpdatingStatus}
          />
        </SettingsPageLayout>
      )}
    </>
  );
};
