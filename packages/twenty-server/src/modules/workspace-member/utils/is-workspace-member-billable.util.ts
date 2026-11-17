import { isWorkspaceMemberDeactivated } from 'src/modules/workspace-member/utils/is-workspace-member-deactivated.util';
import { type WorkspaceMemberWorkspaceEntity } from 'src/modules/workspace-member/standard-objects/workspace-member.workspace-entity';

export const isWorkspaceMemberBillable = (
  workspaceMember: Partial<
    Pick<WorkspaceMemberWorkspaceEntity, 'memberStatus' | 'isPreCreated'>
  >,
): boolean =>
  !isWorkspaceMemberDeactivated(workspaceMember) &&
  workspaceMember.isPreCreated !== true;
