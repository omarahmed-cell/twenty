import { type OwnerResolution } from 'src/modules/actor-link/types/owner-resolution.type';
import { type PendingMemberLink } from 'src/modules/actor-link/types/pending-member-link.type';
import {
  type LinkTargetRecord,
  planPendingLinkUpdates,
} from 'src/modules/actor-link/utils/plan-pending-link-updates.util';

const OWNER_RESOLUTIONS: Record<string, OwnerResolution> = {
  '100': {
    isResolved: true,
    workspaceMemberId: 'member-sara',
    matchedBy: 'EMAIL',
  },
  '200': { isResolved: false, reason: 'EMAIL_NOT_FOUND' },
};

const buildLink = (
  recordId: string,
  hubspotOwnerId = '100',
): PendingMemberLink => ({
  object: 'opportunity',
  recordId,
  field: 'assignedTo',
  hubspotOwnerId,
});

const buildRecords = (records: LinkTargetRecord[]) =>
  new Map(records.map((record) => [record.id, record]));

describe('planPendingLinkUpdates', () => {
  it('fills only empty links and classifies everything else', () => {
    const plan = planPendingLinkUpdates({
      links: [
        buildLink('empty'),
        buildLink('linked'),
        buildLink('unresolved', '200'),
        buildLink('unknown-owner', '999'),
        buildLink('missing'),
        buildLink('deleted'),
        buildLink('empty'),
      ],
      recordsById: buildRecords([
        { id: 'empty', linkedWorkspaceMemberId: null, isDeleted: false },
        {
          id: 'linked',
          linkedWorkspaceMemberId: 'member-omar',
          isDeleted: false,
        },
        { id: 'unresolved', linkedWorkspaceMemberId: null, isDeleted: false },
        {
          id: 'unknown-owner',
          linkedWorkspaceMemberId: null,
          isDeleted: false,
        },
        { id: 'deleted', linkedWorkspaceMemberId: null, isDeleted: true },
      ]),
      ownerResolutionByOwnerId: OWNER_RESOLUTIONS,
    });

    expect(plan).toEqual({
      updates: [{ recordId: 'empty', workspaceMemberId: 'member-sara' }],
      alreadyLinkedCount: 1,
      unresolvedOwnerCount: 2,
      missingRecordCount: 1,
      deletedRecordCount: 1,
      duplicateEntryCount: 1,
    });
  });

  it('never plans to replace a link, even one pointing at another member', () => {
    const plan = planPendingLinkUpdates({
      links: [buildLink('linked')],
      recordsById: buildRecords([
        {
          id: 'linked',
          linkedWorkspaceMemberId: 'member-omar',
          isDeleted: false,
        },
      ]),
      ownerResolutionByOwnerId: OWNER_RESOLUTIONS,
    });

    expect(plan.updates).toEqual([]);
  });

  it('plans nothing on a second run over the linked records', () => {
    const links = [buildLink('a'), buildLink('b'), buildLink('c', '200')];
    const records: LinkTargetRecord[] = ['a', 'b', 'c'].map((id) => ({
      id,
      linkedWorkspaceMemberId: null,
      isDeleted: false,
    }));

    const firstPlan = planPendingLinkUpdates({
      links,
      recordsById: buildRecords(records),
      ownerResolutionByOwnerId: OWNER_RESOLUTIONS,
    });

    const workspaceMemberIdByRecordId = new Map(
      firstPlan.updates.map((update) => [
        update.recordId,
        update.workspaceMemberId,
      ]),
    );
    const secondPlan = planPendingLinkUpdates({
      links,
      recordsById: buildRecords(
        records.map((record) => ({
          ...record,
          linkedWorkspaceMemberId:
            workspaceMemberIdByRecordId.get(record.id) ?? null,
        })),
      ),
      ownerResolutionByOwnerId: OWNER_RESOLUTIONS,
    });

    expect(firstPlan.updates).toHaveLength(2);
    expect(secondPlan.updates).toEqual([]);
    expect(secondPlan.alreadyLinkedCount).toBe(2);
    expect(secondPlan.unresolvedOwnerCount).toBe(1);
  });
});
