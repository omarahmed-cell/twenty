import { isWorkspaceMemberDeactivated } from '@/workspace-member/utils/isWorkspaceMemberDeactivated';

export const filterActiveWorkspaceMembers = <
  TWorkspaceMember extends { memberStatus?: string | null },
>(
  workspaceMembers: TWorkspaceMember[],
) =>
  workspaceMembers.filter(
    (workspaceMember) => !isWorkspaceMemberDeactivated(workspaceMember),
  );
