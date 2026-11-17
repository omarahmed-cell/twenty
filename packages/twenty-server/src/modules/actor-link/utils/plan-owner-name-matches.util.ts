import { isNonEmptyString } from '@sniptt/guards';
import { isDefined } from 'twenty-shared/utils';

import { type HubspotOwnerMap } from 'src/modules/actor-link/types/hubspot-owner.type';
import { type MemberLinkUpdate } from 'src/modules/actor-link/types/member-link-update.type';
import { type OwnerResolution } from 'src/modules/actor-link/types/owner-resolution.type';

export type OwnerNameIndex = {
  workspaceMemberIdByName: Map<string, string>;
  duplicateNames: string[];
  unresolvedNames: string[];
};

export type CreatedByRecord = {
  id: string;
  createdByName: string | null;
  createdByWorkspaceMemberId: string | null;
};

// The member still comes from id or email resolution; the name only picks which owner a row belongs to
export const buildOwnerNameIndex = ({
  ownerMap,
  ownerResolutionByOwnerId,
}: {
  ownerMap: HubspotOwnerMap;
  ownerResolutionByOwnerId: Record<string, OwnerResolution>;
}): OwnerNameIndex => {
  const ownerIdsByName = new Map<string, string[]>();

  for (const [ownerId, owner] of Object.entries(ownerMap)) {
    const name = owner.name?.trim();

    if (!isNonEmptyString(name)) {
      continue;
    }

    ownerIdsByName.set(name, [...(ownerIdsByName.get(name) ?? []), ownerId]);
  }

  const index: OwnerNameIndex = {
    workspaceMemberIdByName: new Map(),
    duplicateNames: [],
    unresolvedNames: [],
  };

  for (const [name, ownerIds] of ownerIdsByName) {
    const ownerResolutions = ownerIds.map(
      (ownerId) => ownerResolutionByOwnerId[ownerId],
    );

    if (
      ownerResolutions.some(
        (ownerResolution) =>
          !isDefined(ownerResolution) || !ownerResolution.isResolved,
      )
    ) {
      if (ownerIds.length > 1) {
        index.duplicateNames.push(name);
      } else {
        index.unresolvedNames.push(name);
      }
      continue;
    }

    const workspaceMemberIds = new Set(
      ownerResolutions.map(
        (ownerResolution) =>
          (ownerResolution as Extract<OwnerResolution, { isResolved: true }>)
            .workspaceMemberId,
      ),
    );

    // Several HubSpot owner ids for one person share a name and resolve to one member
    if (workspaceMemberIds.size > 1) {
      index.duplicateNames.push(name);
      continue;
    }

    index.workspaceMemberIdByName.set(name, [...workspaceMemberIds][0]);
  }

  return index;
};

export const planOwnerNameMatchUpdates = ({
  records,
  workspaceMemberIdByName,
}: {
  records: CreatedByRecord[];
  workspaceMemberIdByName: Map<string, string>;
}): MemberLinkUpdate[] => {
  const updates: MemberLinkUpdate[] = [];

  for (const record of records) {
    if (isNonEmptyString(record.createdByWorkspaceMemberId)) {
      continue;
    }

    const name = record.createdByName?.trim();
    const workspaceMemberId = isNonEmptyString(name)
      ? workspaceMemberIdByName.get(name)
      : undefined;

    if (isDefined(workspaceMemberId)) {
      updates.push({ recordId: record.id, workspaceMemberId });
    }
  }

  return updates;
};
