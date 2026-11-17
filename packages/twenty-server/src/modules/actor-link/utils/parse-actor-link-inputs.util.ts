import { isBoolean, isNonEmptyString, isNull, isString } from '@sniptt/guards';
import { isPlainObject } from 'twenty-shared/utils';

import { type HubspotOwnerMap } from 'src/modules/actor-link/types/hubspot-owner.type';
import { type PendingMemberLink } from 'src/modules/actor-link/types/pending-member-link.type';

const isNullableString = (value: unknown): value is string | null =>
  isNull(value) || isString(value);

export const parseHubspotOwnerMap = (json: unknown): HubspotOwnerMap => {
  if (!isPlainObject(json)) {
    throw new Error('Owner map must be a JSON object keyed by owner id');
  }

  const ownerMap: HubspotOwnerMap = {};

  for (const [ownerId, owner] of Object.entries(json)) {
    if (!isPlainObject(owner)) {
      throw new Error(`Owner ${ownerId} is not an object`);
    }

    const email = owner.email ?? null;
    const workspaceMemberId = owner.workspaceMemberId ?? null;

    if (
      !isString(owner.name) ||
      !isNullableString(email) ||
      !isNullableString(workspaceMemberId)
    ) {
      throw new Error(
        `Owner ${ownerId} is not {name, email, active, workspaceMemberId}`,
      );
    }

    ownerMap[ownerId] = {
      name: owner.name,
      email,
      active: isBoolean(owner.active) ? owner.active : false,
      workspaceMemberId,
    };
  }

  return ownerMap;
};

export const parsePendingMemberLinks = (json: unknown): PendingMemberLink[] => {
  if (!Array.isArray(json)) {
    throw new Error('Links file must be a JSON array');
  }

  return json.map((link, index) => {
    if (
      !isPlainObject(link) ||
      !isNonEmptyString(link.object) ||
      !isNonEmptyString(link.recordId) ||
      !isNonEmptyString(link.field) ||
      !isNonEmptyString(String(link.hubspotOwnerId ?? ''))
    ) {
      throw new Error(
        `Link at index ${index} is not {object, recordId, field, hubspotOwnerId}`,
      );
    }

    return {
      object: link.object,
      recordId: link.recordId,
      field: link.field,
      // HubSpot owner ids are numeric strings; the loader may have written numbers
      hubspotOwnerId: String(link.hubspotOwnerId),
    };
  });
};
