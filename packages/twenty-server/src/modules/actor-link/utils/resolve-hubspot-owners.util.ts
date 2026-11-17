import { isNonEmptyString } from '@sniptt/guards';

import { type HubspotOwnerMap } from 'src/modules/actor-link/types/hubspot-owner.type';
import { type OwnerResolution } from 'src/modules/actor-link/types/owner-resolution.type';

export type WorkspaceMemberIdentity = {
  id: string;
  userEmail: string | null;
};

const normalizeEmail = (email: string) => email.trim().toLowerCase();

// Names are never used here: two reps can share a name, an email or id cannot
export const resolveHubspotOwners = ({
  ownerMap,
  workspaceMembers,
}: {
  ownerMap: HubspotOwnerMap;
  workspaceMembers: WorkspaceMemberIdentity[];
}): Record<string, OwnerResolution> => {
  const workspaceMemberIds = new Set(
    workspaceMembers.map((workspaceMember) => workspaceMember.id),
  );
  const workspaceMemberIdsByEmail = new Map<string, string[]>();

  for (const { id, userEmail } of workspaceMembers) {
    if (!isNonEmptyString(userEmail)) {
      continue;
    }

    const email = normalizeEmail(userEmail);

    workspaceMemberIdsByEmail.set(email, [
      ...(workspaceMemberIdsByEmail.get(email) ?? []),
      id,
    ]);
  }

  const resolutionByOwnerId: Record<string, OwnerResolution> = {};

  for (const [ownerId, owner] of Object.entries(ownerMap)) {
    if (
      isNonEmptyString(owner.workspaceMemberId) &&
      workspaceMemberIds.has(owner.workspaceMemberId)
    ) {
      resolutionByOwnerId[ownerId] = {
        isResolved: true,
        workspaceMemberId: owner.workspaceMemberId,
        matchedBy: 'WORKSPACE_MEMBER_ID',
      };
      continue;
    }

    if (!isNonEmptyString(owner.email?.trim())) {
      resolutionByOwnerId[ownerId] = { isResolved: false, reason: 'NO_EMAIL' };
      continue;
    }

    const matchingWorkspaceMemberIds =
      workspaceMemberIdsByEmail.get(normalizeEmail(owner.email)) ?? [];

    if (matchingWorkspaceMemberIds.length === 1) {
      resolutionByOwnerId[ownerId] = {
        isResolved: true,
        workspaceMemberId: matchingWorkspaceMemberIds[0],
        matchedBy: 'EMAIL',
      };
      continue;
    }

    resolutionByOwnerId[ownerId] = {
      isResolved: false,
      reason:
        matchingWorkspaceMemberIds.length === 0
          ? 'EMAIL_NOT_FOUND'
          : 'AMBIGUOUS_EMAIL',
    };
  }

  return resolutionByOwnerId;
};
