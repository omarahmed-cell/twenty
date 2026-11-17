import { currentWorkspaceMembersState } from '@/auth/states/currentWorkspaceMembersState';
import { type PartialWorkspaceMember } from '@/settings/roles/types/RoleWithPartialMembers';
import { createAtomSelector } from '@/ui/utilities/state/jotai/utils/createAtomSelector';
import { filterActiveWorkspaceMembers } from '@/workspace-member/utils/filterActiveWorkspaceMembers';

export const activeWorkspaceMembersSelector = createAtomSelector<
  PartialWorkspaceMember[]
>({
  key: 'activeWorkspaceMembersSelector',
  get: ({ get }) =>
    filterActiveWorkspaceMembers(get(currentWorkspaceMembersState)),
});
