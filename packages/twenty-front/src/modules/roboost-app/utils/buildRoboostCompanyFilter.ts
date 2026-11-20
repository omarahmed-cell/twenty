import {
  type RoboostCompanyListFilters,
  type RoboostDateRange,
} from '@/roboost-app/types/RoboostCompanyListFilters';
import { isNonEmptyString } from '@sniptt/guards';
import { type RecordGqlOperationFilter } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

const DAYS_BY_RANGE: Record<Exclude<RoboostDateRange, 'any'>, number> = {
  last7: 7,
  last30: 30,
  last90: 90,
  last365: 365,
};

const getRangeStart = (range: RoboostDateRange, now: Date) =>
  range === 'any'
    ? undefined
    : new Date(
        now.getTime() - DAYS_BY_RANGE[range] * 24 * 60 * 60 * 1000,
      ).toISOString();

const isNonEmptyFilter = (filter: RecordGqlOperationFilter | undefined) =>
  isDefined(filter) && Object.keys(filter).length > 0;

export const buildRoboostCompanyFilter = ({
  viewFilter,
  search,
  filters,
  currentWorkspaceMemberId,
  availableFieldNames,
  now,
}: {
  viewFilter: RecordGqlOperationFilter | undefined;
  search: string;
  filters: RoboostCompanyListFilters;
  currentWorkspaceMemberId: string | undefined;
  availableFieldNames: Set<string>;
  now: Date;
}): RecordGqlOperationFilter | undefined => {
  const conditions: RecordGqlOperationFilter[] = [];

  if (isNonEmptyFilter(viewFilter) && isDefined(viewFilter)) {
    conditions.push(viewFilter);
  }

  const trimmedSearch = search.trim();

  if (isNonEmptyString(trimmedSearch)) {
    conditions.push({ name: { ilike: `%${trimmedSearch}%` } });
  }

  if (availableFieldNames.has('accountOwner')) {
    if (filters.ownerId === 'me' && isDefined(currentWorkspaceMemberId)) {
      conditions.push({ accountOwnerId: { eq: currentWorkspaceMemberId } });
    } else if (filters.ownerId === 'none') {
      conditions.push({ accountOwnerId: { is: 'NULL' } });
    } else if (filters.ownerId !== 'any' && filters.ownerId !== 'me') {
      conditions.push({ accountOwnerId: { eq: filters.ownerId } });
    }
  }

  const createdStart = getRangeStart(filters.createdWithin, now);

  if (isDefined(createdStart)) {
    conditions.push({ createdAt: { gte: createdStart } });
  }

  const lastActivityStart = getRangeStart(filters.lastActivityWithin, now);

  if (
    isDefined(lastActivityStart) &&
    availableFieldNames.has('lastActivityDate')
  ) {
    conditions.push({ lastActivityDate: { gte: lastActivityStart } });
  }

  for (const [fieldName, values] of Object.entries(
    filters.selectValuesByFieldName,
  )) {
    if (values.length > 0 && availableFieldNames.has(fieldName)) {
      conditions.push({ [fieldName]: { in: values } });
    }
  }

  if (conditions.length === 0) {
    return undefined;
  }

  return conditions.length === 1 ? conditions[0] : { and: conditions };
};
