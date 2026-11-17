import { getPreCreatedWorkspaceMemberAttachDecision } from 'src/modules/workspace-member/utils/get-pre-created-workspace-member-attach-decision.util';

const PRE_CREATED_ACTIVE_MEMBER = {
  isPreCreated: true,
  memberStatus: 'ACTIVE' as const,
  userEmail: 'Sara@Roboost.app',
};

describe('getPreCreatedWorkspaceMemberAttachDecision', () => {
  it('attaches an active pre-created member on a verified sign-in', () => {
    expect(
      getPreCreatedWorkspaceMemberAttachDecision({
        workspaceMember: PRE_CREATED_ACTIVE_MEMBER,
        isEmailVerified: true,
        isUserIdTaken: false,
      }),
    ).toBe('attach');
  });

  it('does not attach on an unverified sign-in', () => {
    expect(
      getPreCreatedWorkspaceMemberAttachDecision({
        workspaceMember: PRE_CREATED_ACTIVE_MEMBER,
        isEmailVerified: false,
        isUserIdTaken: false,
      }),
    ).toBe('email-not-verified');
  });

  it('never attaches a deactivated pre-created member, even when verified', () => {
    expect(
      getPreCreatedWorkspaceMemberAttachDecision({
        workspaceMember: {
          ...PRE_CREATED_ACTIVE_MEMBER,
          memberStatus: 'DEACTIVATED',
        },
        isEmailVerified: true,
        isUserIdTaken: false,
      }),
    ).toBe('deactivated');
  });

  it('never attaches a member whose email is on a .invalid domain', () => {
    expect(
      getPreCreatedWorkspaceMemberAttachDecision({
        workspaceMember: {
          ...PRE_CREATED_ACTIVE_MEMBER,
          userEmail: 'former.rep@hubspot-import.INVALID ',
        },
        isEmailVerified: true,
        isUserIdTaken: false,
      }),
    ).toBe('ineligible');
  });

  it('never attaches a real member', () => {
    expect(
      getPreCreatedWorkspaceMemberAttachDecision({
        workspaceMember: { ...PRE_CREATED_ACTIVE_MEMBER, isPreCreated: false },
        isEmailVerified: true,
        isUserIdTaken: false,
      }),
    ).toBe('ineligible');
  });

  it('never attaches a member whose placeholder user id belongs to an account', () => {
    expect(
      getPreCreatedWorkspaceMemberAttachDecision({
        workspaceMember: PRE_CREATED_ACTIVE_MEMBER,
        isEmailVerified: true,
        isUserIdTaken: true,
      }),
    ).toBe('ineligible');
  });
});
