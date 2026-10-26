import { resolveAutoAssignedWorkspaceMemberId } from 'src/modules/calendar/calendar-event-assigned-to/utils/resolve-auto-assigned-workspace-member-id.util';

describe('resolveAutoAssignedWorkspaceMemberId', () => {
  it('should pick the only workspace member among the guests', () => {
    expect(
      resolveAutoAssignedWorkspaceMemberId([
        { isOrganizer: true, workspaceMemberId: null },
        { isOrganizer: false, workspaceMemberId: 'member-1' },
        { isOrganizer: false, workspaceMemberId: null },
      ]),
    ).toBe('member-1');
  });

  it('should ignore the organizer even when the organizer is a workspace member', () => {
    expect(
      resolveAutoAssignedWorkspaceMemberId([
        { isOrganizer: true, workspaceMemberId: 'organizer-member' },
        { isOrganizer: false, workspaceMemberId: 'member-1' },
      ]),
    ).toBe('member-1');
  });

  it('should not pick the organizer when they also appear as a guest', () => {
    expect(
      resolveAutoAssignedWorkspaceMemberId([
        { isOrganizer: true, workspaceMemberId: 'organizer-member' },
        { isOrganizer: false, workspaceMemberId: 'organizer-member' },
      ]),
    ).toBeUndefined();
  });

  it('should leave the meeting unassigned when several members are guests', () => {
    expect(
      resolveAutoAssignedWorkspaceMemberId([
        { isOrganizer: true, workspaceMemberId: null },
        { isOrganizer: false, workspaceMemberId: 'member-1' },
        { isOrganizer: false, workspaceMemberId: 'member-2' },
      ]),
    ).toBeUndefined();
  });

  it('should count a member listed twice once', () => {
    expect(
      resolveAutoAssignedWorkspaceMemberId([
        { isOrganizer: false, workspaceMemberId: 'member-1' },
        { isOrganizer: false, workspaceMemberId: 'member-1' },
      ]),
    ).toBe('member-1');
  });

  it('should return nothing when no guest is a workspace member', () => {
    expect(
      resolveAutoAssignedWorkspaceMemberId([
        { isOrganizer: true, workspaceMemberId: null },
        { isOrganizer: false, workspaceMemberId: null },
      ]),
    ).toBeUndefined();
  });
});
