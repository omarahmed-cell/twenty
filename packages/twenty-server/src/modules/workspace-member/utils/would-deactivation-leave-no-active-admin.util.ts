import { isDefined } from 'twenty-shared/utils';

import { isWorkspaceMemberDeactivated } from 'src/modules/workspace-member/utils/is-workspace-member-deactivated.util';
import { type WorkspaceMemberWorkspaceEntity } from 'src/modules/workspace-member/standard-objects/workspace-member.workspace-entity';

export const wouldDeactivationLeaveNoActiveAdmin = ({
  adminWorkspaceMembers,
  workspaceMemberIdToDeactivate,
}: {
  adminWorkspaceMembers: Pick<
    WorkspaceMemberWorkspaceEntity,
    'id' | 'memberStatus' | 'deletedAt'
  >[];
  workspaceMemberIdToDeactivate: string;
}): boolean => {
  const isTargetAnAdmin = adminWorkspaceMembers.some(
    ({ id }) => id === workspaceMemberIdToDeactivate,
  );

  if (!isTargetAnAdmin) {
    return false;
  }

  return !adminWorkspaceMembers.some(
    (adminWorkspaceMember) =>
      adminWorkspaceMember.id !== workspaceMemberIdToDeactivate &&
      !isDefined(adminWorkspaceMember.deletedAt) &&
      !isWorkspaceMemberDeactivated(adminWorkspaceMember),
  );
};
