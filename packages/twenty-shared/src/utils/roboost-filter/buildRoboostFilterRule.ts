import {
  getRoboostFilterFieldKind,
  type RoboostFilterField,
} from '@/utils/roboost-filter/getRoboostFilterFieldKind';
import { type RoboostFilterOperator } from '@/utils/roboost-filter/roboost-filter-operator';
import { getRoboostDatePresetRange } from '@/utils/roboost-filter/getRoboostDatePresetRange';
import { isNonEmptyString } from '@sniptt/guards';
import { type RecordGqlOperationFilter } from '@/types/RecordGqlOperationFilter';
import { isDefined } from '@/utils/validation/isDefined';

export const ROBOOST_TEAM_FILTER_VALUE_PREFIX = 'team:';

export type RoboostFilterRuleValue = string | string[] | null;

const DAY_IN_MS = 24 * 3600 * 1000;

const TEXT_SUBFIELD_BY_TYPE: Record<string, string> = {
  LINKS: 'primaryLinkUrl',
  EMAILS: 'primaryEmail',
  PHONES: 'primaryPhoneNumber',
};

// Extra emails (contacts) and extra domains (company Domain) are matched as well as the primary value
const EXTRA_VALUES_SUBFIELD_BY_TYPE: Record<string, string> = {
  LINKS: 'secondaryLinks',
  EMAILS: 'additionalEmails',
};

// The extras are JSON text, so each value sits between double quotes
const toExtraValuesPattern = (
  operator: RoboostFilterOperator,
  escaped: string,
) => {
  switch (operator) {
    case 'containsAnyOf':
    case 'doesNotContainAnyOf':
      return `%${escaped}%`;
    case 'startsWithAnyOf':
      return `%"${escaped}%`;
    case 'endsWithAnyOf':
      return `%${escaped}"%`;
    default:
      return `%"${escaped}"%`;
  }
};

const toList = (value: RoboostFilterRuleValue) =>
  (Array.isArray(value) ? value : isNonEmptyString(value) ? [value] : [])
    .map((item) => item.trim())
    .filter(isNonEmptyString);

const anyOf = (
  conditions: RecordGqlOperationFilter[],
): RecordGqlOperationFilter => {
  const [first] = conditions;

  return conditions.length === 1 && isDefined(first)
    ? first
    : { or: conditions };
};

const allOf = (
  conditions: RecordGqlOperationFilter[],
): RecordGqlOperationFilter => {
  const [first] = conditions;

  return conditions.length === 1 && isDefined(first)
    ? first
    : { and: conditions };
};

const textCondition = (
  field: RoboostFilterField,
  comparison: Record<string, unknown>,
): RecordGqlOperationFilter => {
  if (field.type === 'FULL_NAME') {
    return {
      or: [
        { [field.name]: { firstName: comparison } },
        { [field.name]: { lastName: comparison } },
      ],
    };
  }
  const subField = TEXT_SUBFIELD_BY_TYPE[field.type];

  return isDefined(subField)
    ? { [field.name]: { [subField]: comparison } }
    : { [field.name]: comparison };
};

// Empty text is stored as '', so "unknown" covers both NULL and ''
const knownCondition = (
  field: RoboostFilterField,
  isKnown: boolean,
): RecordGqlOperationFilter => {
  const kind = getRoboostFilterFieldKind(field);

  if (kind === 'relation') {
    return { [`${field.name}Id`]: { is: isKnown ? 'NOT_NULL' : 'NULL' } };
  }
  if (kind === 'currency') {
    return {
      [field.name]: { amountMicros: { is: isKnown ? 'NOT_NULL' : 'NULL' } },
    };
  }
  if (kind === 'multiSelect') {
    return isKnown
      ? {
          and: [
            { [field.name]: { is: 'NOT_NULL' } },
            { not: { [field.name]: { isEmptyArray: true } } },
          ],
        }
      : {
          or: [
            { [field.name]: { is: 'NULL' } },
            { [field.name]: { isEmptyArray: true } },
          ],
        };
  }
  if (kind === 'text' && field.type !== 'FULL_NAME') {
    return isKnown
      ? allOf([
          textCondition(field, { is: 'NOT_NULL' }),
          textCondition(field, { neq: '' }),
        ])
      : anyOf([
          textCondition(field, { is: 'NULL' }),
          textCondition(field, { eq: '' }),
        ]);
  }

  return { [field.name]: { is: isKnown ? 'NOT_NULL' : 'NULL' } };
};

// The API takes one operator per field filter, so a range becomes an "and" of single bounds
const splitBounds = <TValue>(
  comparison: Record<string, TValue>,
  build: (bound: Record<string, TValue>) => RecordGqlOperationFilter,
): RecordGqlOperationFilter => {
  const bounds = Object.entries(comparison).map(([key, value]) =>
    build({ [key]: value }),
  );

  const [first] = bounds;

  return bounds.length === 1 && isDefined(first) ? first : { and: bounds };
};

const numberCondition = (
  field: RoboostFilterField,
  comparison: Record<string, number>,
): RecordGqlOperationFilter =>
  splitBounds(comparison, (bound) =>
    field.type === 'CURRENCY'
      ? { [field.name]: { amountMicros: bound } }
      : { [field.name]: bound },
  );

const startOfDay = (value: string) => {
  const [year = 1970, month = 1, day = 1] = value
    .slice(0, 10)
    .split('-')
    .map(Number);

  return new Date(year, month - 1, day);
};

const dateCondition = (
  field: RoboostFilterField,
  comparison: Record<string, Date>,
): RecordGqlOperationFilter =>
  splitBounds(comparison, (bound) => ({
    [field.name]: Object.fromEntries(
      Object.entries(bound).map(([key, date]) => [
        key,
        field.type === 'DATE'
          ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
          : date.toISOString(),
      ]),
    ),
  }));

const rangeCondition = (
  field: RoboostFilterField,
  { start, end }: { start: Date; end: Date },
) => dateCondition(field, { gte: start, lt: end });

const getPresetRange = (operator: RoboostFilterOperator, now: Date) => {
  switch (operator) {
    case 'isToday':
      return getRoboostDatePresetRange('today', now);
    case 'isYesterday':
      return getRoboostDatePresetRange('yesterday', now);
    case 'isThisWeek':
      return getRoboostDatePresetRange('thisWeek', now);
    case 'isLastWeek':
      return getRoboostDatePresetRange('lastWeek', now);
    case 'isThisMonth':
      return getRoboostDatePresetRange('thisMonth', now);
    case 'isLastMonth':
      return getRoboostDatePresetRange('lastMonth', now);
    case 'isThisQuarter': {
      const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;

      return {
        start: new Date(now.getFullYear(), quarterStartMonth, 1),
        end: new Date(now.getFullYear(), quarterStartMonth + 3, 1),
      };
    }
    case 'isThisYear':
      return {
        start: new Date(now.getFullYear(), 0, 1),
        end: new Date(now.getFullYear() + 1, 0, 1),
      };
    default:
      return undefined;
  }
};

// Returns undefined while a rule is still incomplete, so half-filled rules never narrow the list
export const buildRoboostFilterRule = ({
  field,
  operator,
  value,
  now = new Date(),
  selectOptionValues = [],
}: {
  field: RoboostFilterField;
  operator: RoboostFilterOperator;
  value: RoboostFilterRuleValue;
  now?: Date;
  selectOptionValues?: string[];
}): RecordGqlOperationFilter | undefined => {
  if (operator === 'isKnown' || operator === 'isUnknown') {
    return knownCondition(field, operator === 'isKnown');
  }
  const kind = getRoboostFilterFieldKind(field);
  const values = toList(value);

  switch (kind) {
    case 'text': {
      if (values.length === 0) {
        return undefined;
      }
      const patterns = values.map((item) => {
        const escaped = item.replace(/[%_]/g, (character) => `\\${character}`);

        switch (operator) {
          case 'containsAnyOf':
          case 'doesNotContainAnyOf':
            return `%${escaped}%`;
          case 'startsWithAnyOf':
            return `${escaped}%`;
          case 'endsWithAnyOf':
            return `%${escaped}`;
          default:
            return escaped;
        }
      });
      const extraSubField = EXTRA_VALUES_SUBFIELD_BY_TYPE[field.type];
      const hasExtraValues =
        isDefined(extraSubField) &&
        (field.type === 'EMAILS' || field.name === 'domainName');
      const match = anyOf(
        patterns.flatMap((pattern, index) => [
          textCondition(field, { ilike: pattern }),
          ...(hasExtraValues
            ? [
                {
                  [field.name]: {
                    [extraSubField]: {
                      ilike: toExtraValuesPattern(
                        operator,
                        values[index]?.replace(
                          /[%_]/g,
                          (character) => `\\${character}`,
                        ) ?? '',
                      ),
                    },
                  },
                },
              ]
            : []),
        ]),
      );

      return operator === 'isNotEqualToAnyOf' ||
        operator === 'doesNotContainAnyOf'
        ? { not: match }
        : match;
    }
    case 'number':
    case 'currency': {
      const numbers = values
        .map(Number)
        .filter((number) => !Number.isNaN(number))
        .map((number) => (kind === 'currency' ? number * 1_000_000 : number));

      if (numbers.length === 0) {
        return undefined;
      }
      const [first = 0, second] = numbers;

      switch (operator) {
        case 'isEqualTo':
          return numberCondition(field, { eq: first });
        case 'isNotEqualTo':
          return numberCondition(field, { neq: first });
        case 'isMoreThan':
          return numberCondition(field, { gt: first });
        case 'isMoreThanOrEqualTo':
          return numberCondition(field, { gte: first });
        case 'isLessThan':
          return numberCondition(field, { lt: first });
        case 'isLessThanOrEqualTo':
          return numberCondition(field, { lte: first });
        case 'isBetween':
          return isDefined(second)
            ? numberCondition(field, {
                gte: Math.min(first, second),
                lte: Math.max(first, second),
              })
            : undefined;
        case 'isNotBetween':
          return isDefined(second)
            ? {
                or: [
                  numberCondition(field, { lt: Math.min(first, second) }),
                  numberCondition(field, { gt: Math.max(first, second) }),
                ],
              }
            : undefined;
        default:
          return undefined;
      }
    }
    case 'date': {
      const presetRange = getPresetRange(operator, now);

      if (isDefined(presetRange)) {
        return rangeCondition(field, presetRange);
      }
      if (values.length === 0) {
        return undefined;
      }
      const [first = '', second] = values;

      switch (operator) {
        case 'isOn': {
          const start = startOfDay(first);

          return rangeCondition(field, {
            start,
            end: new Date(start.getTime() + DAY_IN_MS),
          });
        }
        case 'isBefore':
          return dateCondition(field, { lt: startOfDay(first) });
        case 'isAfter':
          return dateCondition(field, {
            gte: new Date(startOfDay(first).getTime() + DAY_IN_MS),
          });
        case 'isBetween': {
          if (!isDefined(second)) {
            return undefined;
          }
          const firstDay = startOfDay(first);
          const secondDay = startOfDay(second);
          const isOrdered = firstDay.getTime() <= secondDay.getTime();
          const from = isOrdered ? firstDay : secondDay;
          const to = isOrdered ? secondDay : firstDay;

          return rangeCondition(field, {
            start: from,
            end: new Date(to.getTime() + DAY_IN_MS),
          });
        }
        case 'isMoreThanDaysAgo':
        case 'isLessThanDaysAgo':
        case 'isMoreThanDaysFromNow':
        case 'isLessThanDaysFromNow': {
          const days = Number(first);

          if (Number.isNaN(days)) {
            return undefined;
          }
          const isPast =
            operator === 'isMoreThanDaysAgo' ||
            operator === 'isLessThanDaysAgo';
          const boundary = new Date(
            now.getTime() + (isPast ? -1 : 1) * days * DAY_IN_MS,
          );

          if (operator === 'isMoreThanDaysAgo') {
            return dateCondition(field, { lt: boundary });
          }
          if (operator === 'isMoreThanDaysFromNow') {
            return dateCondition(field, { gt: boundary });
          }

          return isPast
            ? dateCondition(field, { gte: boundary, lte: now })
            : dateCondition(field, { gte: now, lte: boundary });
        }
        default:
          return undefined;
      }
    }
    case 'select': {
      if (values.length === 0) {
        return undefined;
      }
      const match = { [field.name]: { in: values } };

      return operator === 'isNoneOf'
        ? { or: [{ not: match }, { [field.name]: { is: 'NULL' } }] }
        : match;
    }
    case 'multiSelect': {
      if (values.length === 0) {
        return undefined;
      }
      const containsAll = allOf(
        values.map((item) => ({ [field.name]: { containsAny: [item] } })),
      );

      switch (operator) {
        case 'isAnyOf':
          return { [field.name]: { containsAny: values } };
        case 'isNoneOf':
          return { not: { [field.name]: { containsAny: values } } };
        case 'isAllOf':
          return containsAll;
        case 'isExactly': {
          const otherValues = selectOptionValues.filter(
            (option) => !values.includes(option),
          );

          return otherValues.length === 0
            ? containsAll
            : allOf([
                containsAll,
                { not: { [field.name]: { containsAny: otherValues } } },
              ]);
        }
        default:
          return undefined;
      }
    }
    case 'boolean': {
      const isTrue = values[0] === 'true';

      if (values.length === 0) {
        return undefined;
      }
      const target = operator === 'isNotEqualTo' ? !isTrue : isTrue;

      return target
        ? { [field.name]: { eq: true } }
        : {
            or: [
              { [field.name]: { eq: false } },
              { [field.name]: { is: 'NULL' } },
            ],
          };
    }
    case 'relation': {
      if (values.length === 0) {
        return undefined;
      }
      const key = `${field.name}Id`;
      // "team:<id>" picks a team; the server matches whoever is in it when the query runs
      const ids = [
        ...new Set(
          values.map((value) =>
            value.startsWith(ROBOOST_TEAM_FILTER_VALUE_PREFIX)
              ? value.slice(ROBOOST_TEAM_FILTER_VALUE_PREFIX.length)
              : value,
          ),
        ),
      ];

      return operator === 'isNoneOf'
        ? {
            or: [{ not: { [key]: { in: ids } } }, { [key]: { is: 'NULL' } }],
          }
        : { [key]: { in: ids } };
    }
    default:
      return undefined;
  }
};
