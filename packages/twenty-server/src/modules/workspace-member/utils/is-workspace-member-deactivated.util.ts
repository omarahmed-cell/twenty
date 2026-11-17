import { WORKSPACE_MEMBER_STATUS } from 'src/modules/workspace-member/constants/workspace-member-status.constant';
import { type WorkspaceMemberWorkspaceEntity } from 'src/modules/workspace-member/standard-objects/workspace-member.workspace-entity';

// Members of workspaces that have not run the member status upgrade carry no status and stay active
export const isWorkspaceMemberDeactivated = (
  workspaceMember: Partial<
    Pick<WorkspaceMemberWorkspaceEntity, 'memberStatus'>
  >,
): boolean =>
  workspaceMember.memberStatus === WORKSPACE_MEMBER_STATUS.DEACTIVATED;
