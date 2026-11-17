import { isNonEmptyString } from '@sniptt/guards';
import { isDefined } from 'twenty-shared/utils';

import { type MemberLinkUpdate } from 'src/modules/actor-link/types/member-link-update.type';
import { type OwnerResolution } from 'src/modules/actor-link/types/owner-resolution.type';
import { type PendingMemberLink } from 'src/modules/actor-link/types/pending-member-link.type';

export type LinkTargetRecord = {
  id: string;
  linkedWorkspaceMemberId: string | null;
  isDeleted: boolean;
};

export type PendingLinkPlan = {
  updates: MemberLinkUpdate[];
  alreadyLinkedCount: number;
  unresolvedOwnerCount: number;
  missingRecordCount: number;
  deletedRecordCount: number;
  duplicateEntryCount: number;
};

// Links are expected to share one object and field; a link never replaces an existing value
export const planPendingLinkUpdates = ({
  links,
  recordsById,
  ownerResolutionByOwnerId,
}: {
  links: PendingMemberLink[];
  recordsById: Map<string, LinkTargetRecord>;
  ownerResolutionByOwnerId: Record<string, OwnerResolution>;
}): PendingLinkPlan => {
  const plan: PendingLinkPlan = {
    updates: [],
    alreadyLinkedCount: 0,
    unresolvedOwnerCount: 0,
    missingRecordCount: 0,
    deletedRecordCount: 0,
    duplicateEntryCount: 0,
  };
  const seenRecordIds = new Set<string>();

  for (const link of links) {
    if (seenRecordIds.has(link.recordId)) {
      plan.duplicateEntryCount++;
      continue;
    }

    seenRecordIds.add(link.recordId);

    const record = recordsById.get(link.recordId);

    if (!isDefined(record)) {
      plan.missingRecordCount++;
      continue;
    }

    if (record.isDeleted) {
      plan.deletedRecordCount++;
      continue;
    }

    if (isNonEmptyString(record.linkedWorkspaceMemberId)) {
      plan.alreadyLinkedCount++;
      continue;
    }

    const ownerResolution = ownerResolutionByOwnerId[link.hubspotOwnerId];

    if (!isDefined(ownerResolution) || !ownerResolution.isResolved) {
      plan.unresolvedOwnerCount++;
      continue;
    }

    plan.updates.push({
      recordId: record.id,
      workspaceMemberId: ownerResolution.workspaceMemberId,
    });
  }

  return plan;
};
