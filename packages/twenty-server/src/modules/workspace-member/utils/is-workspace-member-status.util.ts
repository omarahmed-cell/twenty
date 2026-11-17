import {
  WORKSPACE_MEMBER_STATUS,
  type WorkspaceMemberStatus,
} from 'src/modules/workspace-member/constants/workspace-member-status.constant';

export const isWorkspaceMemberStatus = (
  value: string,
): value is WorkspaceMemberStatus =>
  (Object.values(WORKSPACE_MEMBER_STATUS) as string[]).includes(value);
