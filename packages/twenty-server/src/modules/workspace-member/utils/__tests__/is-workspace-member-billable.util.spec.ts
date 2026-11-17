import { isWorkspaceMemberBillable } from 'src/modules/workspace-member/utils/is-workspace-member-billable.util';

describe('isWorkspaceMemberBillable', () => {
  it('counts only active members that have an account toward seats', () => {
    const workspaceMembers = [
      { memberStatus: 'ACTIVE' as const, isPreCreated: false },
      { memberStatus: 'DEACTIVATED' as const, isPreCreated: false },
      { memberStatus: 'ACTIVE' as const, isPreCreated: true },
      { memberStatus: 'DEACTIVATED' as const, isPreCreated: true },
      { memberStatus: 'ACTIVE' as const, isPreCreated: false },
    ];

    expect(workspaceMembers.filter(isWorkspaceMemberBillable)).toHaveLength(2);
  });

  it('counts members of workspaces that have not run the status upgrade', () => {
    expect(isWorkspaceMemberBillable({})).toBe(true);
  });
});
