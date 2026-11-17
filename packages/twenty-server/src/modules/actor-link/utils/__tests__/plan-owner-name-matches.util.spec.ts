import { type HubspotOwner } from 'src/modules/actor-link/types/hubspot-owner.type';
import { type OwnerResolution } from 'src/modules/actor-link/types/owner-resolution.type';
import {
  buildOwnerNameIndex,
  type CreatedByRecord,
  planOwnerNameMatchUpdates,
} from 'src/modules/actor-link/utils/plan-owner-name-matches.util';

const buildOwner = (name: string): HubspotOwner => ({
  name,
  email: null,
  active: true,
  workspaceMemberId: null,
});

const resolvedTo = (workspaceMemberId: string): OwnerResolution => ({
  isResolved: true,
  workspaceMemberId,
  matchedBy: 'EMAIL',
});

describe('buildOwnerNameIndex', () => {
  it('keeps unique resolved names and lists duplicate and unresolved ones', () => {
    const index = buildOwnerNameIndex({
      ownerMap: {
        '1': buildOwner(' Sara Adel '),
        '2': buildOwner('Omar Nabil'),
        '3': buildOwner('Omar Nabil'),
        '4': buildOwner('Mona Ali'),
      },
      ownerResolutionByOwnerId: {
        '1': resolvedTo('member-sara'),
        '2': resolvedTo('member-omar'),
        '3': resolvedTo('member-omar'),
        '4': { isResolved: false, reason: 'EMAIL_NOT_FOUND' },
      },
    });

    expect([...index.workspaceMemberIdByName]).toEqual([
      ['Sara Adel', 'member-sara'],
    ]);
    expect(index.duplicateNames).toEqual(['Omar Nabil']);
    expect(index.unresolvedNames).toEqual(['Mona Ali']);
  });
});

describe('planOwnerNameMatchUpdates', () => {
  const workspaceMemberIdByName = new Map([['Sara Adel', 'member-sara']]);

  it('links only unlinked rows whose trimmed name matches exactly', () => {
    const updates = planOwnerNameMatchUpdates({
      records: [
        {
          id: 'a',
          createdByName: 'Sara Adel ',
          createdByWorkspaceMemberId: null,
        },
        {
          id: 'b',
          createdByName: 'sara adel',
          createdByWorkspaceMemberId: null,
        },
        {
          id: 'c',
          createdByName: 'Sara Adel',
          createdByWorkspaceMemberId: 'member-other',
        },
        { id: 'd', createdByName: null, createdByWorkspaceMemberId: null },
      ],
      workspaceMemberIdByName,
    });

    expect(updates).toEqual([
      { recordId: 'a', workspaceMemberId: 'member-sara' },
    ]);
  });

  it('plans nothing once the matched rows are linked', () => {
    const records: CreatedByRecord[] = [
      { id: 'a', createdByName: 'Sara Adel', createdByWorkspaceMemberId: null },
    ];
    const firstUpdates = planOwnerNameMatchUpdates({
      records,
      workspaceMemberIdByName,
    });

    const secondUpdates = planOwnerNameMatchUpdates({
      records: records.map((record) => ({
        ...record,
        createdByWorkspaceMemberId: firstUpdates[0].workspaceMemberId,
      })),
      workspaceMemberIdByName,
    });

    expect(firstUpdates).toHaveLength(1);
    expect(secondUpdates).toEqual([]);
  });
});
