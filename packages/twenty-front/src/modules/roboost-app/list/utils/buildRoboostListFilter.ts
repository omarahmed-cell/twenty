import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { getRoboostLabelIdentifierFieldName } from '@/roboost-app/fields/getRoboostRecordLabel';
import {
  type RoboostFilterRule,
  type RoboostListFilters,
} from '@/roboost-app/list/types/RoboostListFilters';
import { getRoboostRangeStart } from '@/roboost-app/list/utils/getRoboostRangeStart';
import { isNonEmptyString, isString } from '@sniptt/guards';
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

const getEmptyCheckTarget = (field: FieldMetadataItem) => {
  if (field.type === FieldMetadataType.RELATION) {
    return { key: `${field.name}Id`, value: undefined };
  }
  const subField = TEXT_SUBFIELD_BY_TYPE[field.type];

  return { key: field.name, value: subField };
};

const buildEmptyCheck = (
  field: FieldMetadataItem,
  isEmpty: boolean,
): RecordGqlOperationFilter => {
  const target = getEmptyCheckTarget(field);
  const check = { is: isEmpty ? 'NULL' : 'NOT_NULL' };

  return isDefined(target.value)
    ? { [target.key]: { [target.value]: check } }
    : { [target.key]: check };
};

const toList = (value: RoboostFilterRule['value']) =>
  Array.isArray(value) ? value : isNonEmptyString(value) ? [value] : [];

export const buildRoboostRuleFilter = (
  rule: RoboostFilterRule,
  field: FieldMetadataItem,
): RecordGqlOperationFilter | undefined => {
  if (rule.operand === 'isEmpty' || rule.operand === 'isNotEmpty') {
    return buildEmptyCheck(field, rule.operand === 'isEmpty');
  }
  const value = rule.value;
  const text = isString(value) ? value.trim() : '';

  switch (field.type) {
    case FieldMetadataType.SELECT:
    case FieldMetadataType.RATING: {
      const values = toList(value);

      if (values.length === 0) {
        return undefined;
      }
      const match = { [field.name]: { in: values } };

      return rule.operand === 'isNoneOf' ? { not: match } : match;
    }
    case FieldMetadataType.MULTI_SELECT: {
      const values = toList(value);

      if (values.length === 0) {
        return undefined;
      }
      const match = { [field.name]: { containsAny: values } };

      return rule.operand === 'isNoneOf' ? { not: match } : match;
    }
    case FieldMetadataType.RELATION: {
      const ids = toList(value);

      if (ids.length === 0) {
        return undefined;
      }
      const match = { [`${field.name}Id`]: { in: ids } };

      return rule.operand === 'isNot' ? { not: match } : match;
    }
    case FieldMetadataType.BOOLEAN:
      return { [field.name]: { eq: value === 'true' } };
    case FieldMetadataType.NUMBER:
    case FieldMetadataType.NUMERIC:
    case FieldMetadataType.CURRENCY: {
      if (!isNonEmptyString(text) || Number.isNaN(Number(text))) {
        return undefined;
      }
      const number =
        field.type === FieldMetadataType.CURRENCY
          ? Number(text) * 1_000_000
          : Number(text);
      const comparison =
        rule.operand === 'greaterThan'
          ? { gte: number }
          : rule.operand === 'lessThan'
            ? { lte: number }
            : { eq: number };

      return field.type === FieldMetadataType.CURRENCY
        ? { [field.name]: { amountMicros: comparison } }
        : { [field.name]: comparison };
    }
    case FieldMetadataType.DATE:
    case FieldMetadataType.DATE_TIME: {
      if (!isNonEmptyString(text)) {
        return undefined;
      }
      const iso =
        field.type === FieldMetadataType.DATE
          ? text
          : new Date(text).toISOString();

      return rule.operand === 'before'
        ? { [field.name]: { lt: iso } }
        : { [field.name]: { gte: iso } };
    }
    default: {
      if (!isNonEmptyString(text)) {
        return undefined;
      }
      const match = buildTextMatch(field, `%${text}%`);

      return rule.operand === 'doesNotContain' ? { not: match } : match;
    }
  }
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
}: {
  objectMetadataItem: EnrichedObjectMetadataItem;
  viewFilter: RecordGqlOperationFilter | undefined;
  search: string;
  filters: RoboostListFilters;
  ownerFieldName: string | undefined;
  currentWorkspaceMemberId: string | undefined;
  now: Date;
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

  const advancedConditions = filters.advanced.rules
    .map((rule) => {
      const field = fieldsByName.get(rule.fieldName);

      return isDefined(field) ? buildRoboostRuleFilter(rule, field) : undefined;
    })
    .filter(isDefined);
  const advancedFilter = combine(
    advancedConditions,
    filters.advanced.conjunction,
  );

  if (isDefined(advancedFilter)) {
    conditions.push(advancedFilter);
  }

  return combine(conditions, 'and');
};
