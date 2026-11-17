import { useRefreshCurrentWorkspaceMembers } from '@/settings/members/hooks/useRefreshCurrentWorkspaceMembers';
import { type WorkspaceMemberStatus } from '@/workspace-member/types/WorkspaceMemberStatus';
import { useMutation } from '@apollo/client/react';
import { UpdateWorkspaceMemberStatusDocument } from '~/generated-metadata/graphql';

export const useUpdateWorkspaceMemberStatus = () => {
  const [updateWorkspaceMemberStatusMutation, { loading }] = useMutation(
    UpdateWorkspaceMemberStatusDocument,
  );
  const { refreshCurrentWorkspaceMembers } =
    useRefreshCurrentWorkspaceMembers();

  const updateWorkspaceMemberStatus = async ({
    workspaceMemberId,
    memberStatus,
  }: {
    workspaceMemberId: string;
    memberStatus: WorkspaceMemberStatus;
  }) => {
    await updateWorkspaceMemberStatusMutation({
      variables: { workspaceMemberId, memberStatus },
    });

    await refreshCurrentWorkspaceMembers();
  };

  return { updateWorkspaceMemberStatus, loading };
};
