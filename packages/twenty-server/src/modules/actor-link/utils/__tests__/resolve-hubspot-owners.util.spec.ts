import { type HubspotOwner } from 'src/modules/actor-link/types/hubspot-owner.type';
import { resolveHubspotOwners } from 'src/modules/actor-link/utils/resolve-hubspot-owners.util';

const buildOwner = (owner: Partial<HubspotOwner>): HubspotOwner => ({
  name: 'Sara Adel',
  email: null,
  active: true,
  workspaceMemberId: null,
  ...owner,
});

const WORKSPACE_MEMBERS = [
  { id: 'member-sara', userEmail: 'sara@roboost.app' },
  { id: 'member-omar', userEmail: 'Omar@Roboost.app' },
  { id: 'member-shared-1', userEmail: 'sales@roboost.app' },
  { id: 'member-shared-2', userEmail: 'SALES@roboost.app' },
  { id: 'member-no-email', userEmail: null },
];

describe('resolveHubspotOwners', () => {
  it('uses the owner workspace member id when that member exists', () => {
    const resolutions = resolveHubspotOwners({
      ownerMap: {
        '1': buildOwner({
          workspaceMemberId: 'member-sara',
          email: 'omar@roboost.app',
        }),
      },
      workspaceMembers: WORKSPACE_MEMBERS,
    });

    expect(resolutions['1']).toEqual({
      isResolved: true,
      workspaceMemberId: 'member-sara',
      matchedBy: 'WORKSPACE_MEMBER_ID',
    });
  });

  it('falls back to the email, case-insensitively, when the id is missing or unknown', () => {
    const resolutions = resolveHubspotOwners({
      ownerMap: {
        '1': buildOwner({ email: ' OMAR@roboost.app ' }),
        '2': buildOwner({
          workspaceMemberId: 'member-deleted',
          email: 'sara@roboost.app',
        }),
      },
      workspaceMembers: WORKSPACE_MEMBERS,
    });

    expect(resolutions['1']).toEqual({
      isResolved: true,
      workspaceMemberId: 'member-omar',
      matchedBy: 'EMAIL',
    });
    expect(resolutions['2']).toEqual({
      isResolved: true,
      workspaceMemberId: 'member-sara',
      matchedBy: 'EMAIL',
    });
  });

  it('skips an email shared by several members', () => {
    const resolutions = resolveHubspotOwners({
      ownerMap: { '1': buildOwner({ email: 'sales@roboost.app' }) },
      workspaceMembers: WORKSPACE_MEMBERS,
    });

    expect(resolutions['1']).toEqual({
      isResolved: false,
      reason: 'AMBIGUOUS_EMAIL',
    });
  });

  it('never matches a member by name', () => {
    const resolutions = resolveHubspotOwners({
      ownerMap: {
        '1': buildOwner({ name: 'Sara Adel', email: null }),
        '2': buildOwner({ name: 'Sara Adel', email: 'nobody@roboost.app' }),
      },
      workspaceMembers: [{ id: 'member-sara', userEmail: 'sara@roboost.app' }],
    });

    expect(resolutions['1']).toEqual({ isResolved: false, reason: 'NO_EMAIL' });
    expect(resolutions['2']).toEqual({
      isResolved: false,
      reason: 'EMAIL_NOT_FOUND',
    });
  });
});
