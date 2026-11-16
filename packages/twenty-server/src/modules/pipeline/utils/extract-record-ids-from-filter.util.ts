import { isNonEmptyString } from '@sniptt/guards';
import { isDefined } from 'twenty-shared/utils';

// Bulk writes the UI sends select records by id; any other filter shape is out of reach here
export const extractRecordIdsFromFilter = (
  filter: unknown,
): string[] | undefined => {
  if (!isDefined(filter) || typeof filter !== 'object') {
    return undefined;
  }

  const idFilter = (filter as { id?: { in?: unknown; eq?: unknown } }).id;

  if (Object.keys(filter).length !== 1 || !isDefined(idFilter)) {
    return undefined;
  }

  if (Array.isArray(idFilter.in) && idFilter.in.every(isNonEmptyString)) {
    return idFilter.in as string[];
  }

  if (isNonEmptyString(idFilter.eq)) {
    return [idFilter.eq];
  }

  return undefined;
};
