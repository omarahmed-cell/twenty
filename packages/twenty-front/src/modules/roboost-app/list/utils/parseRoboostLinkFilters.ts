import { type RoboostAdvancedFilter } from '@/roboost-app/list/types/RoboostListFilters';
import { isNonEmptyString } from '@sniptt/guards';
import { type RecordGqlOperationFilter } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

// Links from notifications open a list with advanced filters (rbFilters) and an exact set of records (filterIds)
export const parseRoboostLinkFilters = (
  searchParams: URLSearchParams,
): {
  advanced: RoboostAdvancedFilter | null;
  idsFilter: RecordGqlOperationFilter | null;
} => {
  const rawFilters = searchParams.get('rbFilters');
  const rawIds = searchParams.get('filterIds');
  let advanced: RoboostAdvancedFilter | null = null;

  if (isNonEmptyString(rawFilters)) {
    try {
      const parsed = JSON.parse(rawFilters) as Partial<RoboostAdvancedFilter>;

      if (Array.isArray(parsed.groups)) {
        advanced = {
          groups: parsed.groups,
          associations: Array.isArray(parsed.associations)
            ? parsed.associations
            : [],
        };
      }
    } catch {
      advanced = null;
    }
  }

  const ids = isNonEmptyString(rawIds)
    ? rawIds.split(',').filter(isNonEmptyString)
    : [];

  return {
    advanced,
    idsFilter: ids.length > 0 ? { id: { in: ids } } : null,
  };
};
