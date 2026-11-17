import { wouldDeactivationLeaveNoActiveAdmin } from 'src/modules/workspace-member/utils/would-deactivation-leave-no-active-admin.util';

const buildAdmin = (
  id: string,
  memberStatus: 'ACTIVE' | 'DEACTIVATED' = 'ACTIVE',
) => ({ id, memberStatus, deletedAt: null });

describe('wouldDeactivationLeaveNoActiveAdmin', () => {
  it('refuses deactivating the only active admin', () => {
    expect(
      wouldDeactivationLeaveNoActiveAdmin({
        adminWorkspaceMembers: [
          buildAdmin('admin-1'),
          buildAdmin('admin-2', 'DEACTIVATED'),
        ],
        workspaceMemberIdToDeactivate: 'admin-1',
      }),
    ).toBe(true);
  });

  it('allows deactivating an admin when another admin stays active', () => {
    expect(
      wouldDeactivationLeaveNoActiveAdmin({
        adminWorkspaceMembers: [buildAdmin('admin-1'), buildAdmin('admin-2')],
        workspaceMemberIdToDeactivate: 'admin-1',
      }),
    ).toBe(false);
  });

  it('ignores members that are not admins', () => {
    expect(
      wouldDeactivationLeaveNoActiveAdmin({
        adminWorkspaceMembers: [buildAdmin('admin-1')],
        workspaceMemberIdToDeactivate: 'member-1',
      }),
    ).toBe(false);
  });
});
