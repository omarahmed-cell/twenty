type WorkspaceMemberWithStatus = {
  memberStatus?: string | null;
};

export const isWorkspaceMemberDeactivated = (
  workspaceMember: WorkspaceMemberWithStatus,
) => workspaceMember.memberStatus === 'DEACTIVATED';
