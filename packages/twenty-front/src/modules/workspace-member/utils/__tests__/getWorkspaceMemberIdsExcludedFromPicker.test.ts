import { getWorkspaceMemberIdsExcludedFromPicker } from '@/workspace-member/utils/getWorkspaceMemberIdsExcludedFromPicker';
import { CoreObjectNameSingular } from 'twenty-shared/types';

const DEACTIVATED_WORKSPACE_MEMBER_IDS = ['deactivated-member-id'];

describe('getWorkspaceMemberIdsExcludedFromPicker', () => {
  it('excludes deactivated members when the picker searches workspace members', () => {
    expect(
      getWorkspaceMemberIdsExcludedFromPicker({
        objectNameSingulars: [CoreObjectNameSingular.WorkspaceMember],
        deactivatedWorkspaceMemberIds: DEACTIVATED_WORKSPACE_MEMBER_IDS,
      }),
    ).toEqual(DEACTIVATED_WORKSPACE_MEMBER_IDS);
  });

  it('excludes nothing when the picker searches other objects', () => {
    expect(
      getWorkspaceMemberIdsExcludedFromPicker({
        objectNameSingulars: [CoreObjectNameSingular.Company],
        deactivatedWorkspaceMemberIds: DEACTIVATED_WORKSPACE_MEMBER_IDS,
      }),
    ).toEqual([]);
  });
});
