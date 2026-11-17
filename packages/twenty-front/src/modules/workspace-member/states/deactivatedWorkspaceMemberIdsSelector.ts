import { currentWorkspaceMembersState } from '@/auth/states/currentWorkspaceMembersState';
import { createAtomSelector } from '@/ui/utilities/state/jotai/utils/createAtomSelector';
import { isWorkspaceMemberDeactivated } from '@/workspace-member/utils/isWorkspaceMemberDeactivated';

export const deactivatedWorkspaceMemberIdsSelector = createAtomSelector<
  string[]
>({
  key: 'deactivatedWorkspaceMemberIdsSelector',
  get: ({ get }) =>
    get(currentWorkspaceMembersState)
      .filter(isWorkspaceMemberDeactivated)
      .map((workspaceMember) => workspaceMember.id),
});
