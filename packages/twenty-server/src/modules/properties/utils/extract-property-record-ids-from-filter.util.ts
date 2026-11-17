import { isDefined, isPlainObject } from 'twenty-shared/utils';

import { extractRecordIdsFromFilter } from 'src/modules/pipeline/utils/extract-record-ids-from-filter.util';

// The REST API wraps every filter in a root "and", so a one-item "and" is read through
export const extractPropertyRecordIdsFromFilter = (
  filter: unknown,
): string[] | undefined => {
  if (
    isPlainObject(filter) &&
    Object.keys(filter).length === 1 &&
    Array.isArray(filter.and) &&
    filter.and.length === 1
  ) {
    return extractPropertyRecordIdsFromFilter(filter.and[0]);
  }

  return isDefined(filter) ? extractRecordIdsFromFilter(filter) : undefined;
};
