import {
  expandRoboostTeamFilterValues,
  getRoboostTeamIdFromFilterValue,
} from '@/roboost-app/users-and-teams/utils/roboostTeamFilterValue';
import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { getRoboostLabelIdentifierFieldName } from '@/roboost-app/fields/getRoboostRecordLabel';
import { buildRoboostFilterRule } from '@/roboost-app/filters/utils/buildRoboostFilterRule';
import { type RoboostListFilters } from '@/roboost-app/list/types/RoboostListFilters';
import { getRoboostRangeStart } from '@/roboost-app/list/utils/getRoboostRangeStart';
import { isNonEmptyString } from '@sniptt/guards';
import { type RecordGqlOperationFilter } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import { FieldMetadataType } from '~/generated-metadata/graphql';

const TEXT_SUBFIELD_BY_TYPE: Partial<Record<FieldMetadataType, string>> = {
  [FieldMetadataType.LINKS]: 'primaryLinkUrl',
  [FieldMetadataType.EMAILS]: 'primaryEmail',
  [FieldMetadataType.PHONES]: 'primaryPhoneNumber',
};

const buildTextMatch = (
  field: FieldMetadataItem,
  pattern: string,
): RecordGqlOperationFilter => {
  if (field.type === FieldMetadataType.FULL_NAME) {
    return {
      or: [
        { [field.name]: { firstName: { ilike: pattern } } },
        { [field.name]: { lastName: { ilike: pattern } } },
      ],
    };
  }
  const subField = TEXT_SUBFIELD_BY_TYPE[field.type];

  return isDefined(subField)
    ? { [field.name]: { [subField]: { ilike: pattern } } }
    : { [field.name]: { ilike: pattern } };
};

const combine = (
  conditions: RecordGqlOperationFilter[],
  conjunction: 'and' | 'or',
): RecordGqlOperationFilter | undefined => {
  if (conditions.length === 0) {
    return undefined;
  }

  return conditions.length === 1
    ? conditions[0]
    : { [conjunction]: conditions };
};

const SEARCHABLE_FIELD_NAMES = ['domainName', 'emails', 'phones'];

export const buildRoboostListFilter = ({
  objectMetadataItem,
  viewFilter,
  search,
  filters,
  ownerFieldName,
  currentWorkspaceMemberId,
  now,
  teamMemberIdsByTeamId = {},
}: {
  objectMetadataItem: EnrichedObjectMetadataItem;
  viewFilter: RecordGqlOperationFilter | undefined;
  search: string;
  filters: RoboostListFilters;
  ownerFieldName: string | undefined;
  currentWorkspaceMemberId: string | undefined;
  now: Date;
  teamMemberIdsByTeamId?: Record<string, string[]>;
}): RecordGqlOperationFilter | undefined => {
  const fieldsByName = new Map(
    objectMetadataItem.fields
      .filter((field) => field.isActive)
      .map((field) => [field.name, field]),
  );
  const conditions: RecordGqlOperationFilter[] = [];

  if (isDefined(viewFilter) && Object.keys(viewFilter).length > 0) {
    conditions.push(viewFilter);
  }

  const trimmedSearch = search.trim();

  if (isNonEmptyString(trimmedSearch)) {
    const searchFields = [
      getRoboostLabelIdentifierFieldName(objectMetadataItem),
      ...SEARCHABLE_FIELD_NAMES,
    ]
      .map((fieldName) => fieldsByName.get(fieldName))
      .filter(isDefined);
    const searchConditions = searchFields.map((field) =>
      buildTextMatch(field, `%${trimmedSearch}%`),
    );
    const searchFilter = combine(searchConditions, 'or');

    if (isDefined(searchFilter)) {
      conditions.push(searchFilter);
    }
  }

  if (isDefined(ownerFieldName) && filters.ownerId !== 'any') {
    const key = `${ownerFieldName}Id`;

    if (filters.ownerId === 'me' && isDefined(currentWorkspaceMemberId)) {
      conditions.push({ [key]: { eq: currentWorkspaceMemberId } });
    } else if (filters.ownerId === 'none') {
      conditions.push({ [key]: { is: 'NULL' } });
    } else if (isDefined(getRoboostTeamIdFromFilterValue(filters.ownerId))) {
      conditions.push({
        [key]: {
          in: expandRoboostTeamFilterValues(
            [filters.ownerId],
            teamMemberIdsByTeamId,
          ),
        },
      });
    } else if (filters.ownerId !== 'me') {
      conditions.push({ [key]: { eq: filters.ownerId } });
    }
  }

  const createdStart = getRoboostRangeStart(filters.createdWithin, now);

  if (isDefined(createdStart)) {
    conditions.push({ createdAt: { gte: createdStart } });
  }

  const lastActivityStart = getRoboostRangeStart(
    filters.lastActivityWithin,
    now,
  );

  if (isDefined(lastActivityStart) && fieldsByName.has('lastActivityDate')) {
    conditions.push({ lastActivityDate: { gte: lastActivityStart } });
  }

  for (const [fieldName, values] of Object.entries(
    filters.selectValuesByFieldName,
  )) {
    if (values.length > 0 && fieldsByName.has(fieldName)) {
      conditions.push({ [fieldName]: { in: values } });
    }
  }

  const groupFilters = filters.advanced.groups
    .map((group) =>
      combine(
        group.rules
          .map((rule) => {
            const field = fieldsByName.get(rule.fieldName);

            return isDefined(field)
              ? buildRoboostFilterRule({
                  field,
                  operator: rule.operator,
                  value: Array.isArray(rule.value)
                    ? expandRoboostTeamFilterValues(
                        rule.value,
                        teamMemberIdsByTeamId,
                      )
                    : rule.value,
                  now,
                  selectOptionValues: (field.options ?? []).map(
                    (option) => option.value,
                  ),
                })
              : undefined;
          })
          .filter(isDefined),
        'and',
      ),
    )
    .filter(isDefined);
  const propertiesFilter = combine(groupFilters, 'or');

  if (isDefined(propertiesFilter)) {
    conditions.push(propertiesFilter);
  }

  for (const association of filters.advanced.associations) {
    if (isDefined(association.resolvedFilter)) {
      conditions.push(association.resolvedFilter);
    }
  }

  return combine(conditions, 'and');
};
