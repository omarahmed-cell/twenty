import { isWorkspaceMemberDeactivated } from 'src/modules/workspace-member/utils/is-workspace-member-deactivated.util';
import { normalizeWorkspaceMemberEmail } from 'src/modules/workspace-member/utils/normalize-workspace-member-email.util';
import { type WorkspaceMemberWorkspaceEntity } from 'src/modules/workspace-member/standard-objects/workspace-member.workspace-entity';

export type PreCreatedWorkspaceMemberAttachDecision =
  | 'attach'
  | 'deactivated'
  | 'email-not-verified'
  | 'ineligible';

export const getPreCreatedWorkspaceMemberAttachDecision = ({
  workspaceMember,
  isEmailVerified,
  isUserIdTaken,
}: {
  workspaceMember: Pick<
    WorkspaceMemberWorkspaceEntity,
    'isPreCreated' | 'memberStatus' | 'userEmail'
  >;
  isEmailVerified: boolean;
  isUserIdTaken: boolean;
}): PreCreatedWorkspaceMemberAttachDecision => {
  if (workspaceMember.isPreCreated !== true) {
    return 'ineligible';
  }

  if (isWorkspaceMemberDeactivated(workspaceMember)) {
    return 'deactivated';
  }

  // .invalid is the reserved placeholder domain, so no real inbox can claim it
  if (
    normalizeWorkspaceMemberEmail(workspaceMember.userEmail ?? '').endsWith(
      '.invalid',
    ) ||
    isUserIdTaken
  ) {
    return 'ineligible';
  }

  return isEmailVerified ? 'attach' : 'email-not-verified';
};
