import { t } from '@lingui/core/macro';
import { isNonEmptyString } from '@sniptt/guards';
import { ViewFilterOperand } from 'twenty-shared/types';

// HubSpot's wording; list-type filters (select, multi-select, relation, actor) read "is any of" / "is none of"
const LIST_FILTER_TYPES = new Set([
  'SELECT',
  'MULTI_SELECT',
  'RELATION',
  'ACTOR',
  'RATING',
]);

export const getOperandLabel = (
  operand: ViewFilterOperand | null | undefined,
  timeZoneAbbreviation?: string | null | undefined,
  filterType?: string | null,
) => {
  const shouldDisplayTimeZoneAbbreviation =
    isNonEmptyString(timeZoneAbbreviation);

  const timeZoneAbbreviationSuffix = shouldDisplayTimeZoneAbbreviation
    ? ` (${timeZoneAbbreviation})`
    : '';
  const isListFilter = isNonEmptyString(filterType)
    ? LIST_FILTER_TYPES.has(filterType)
    : false;

  switch (operand) {
    case ViewFilterOperand.CONTAINS:
      return t`contains any of`;
    case ViewFilterOperand.DOES_NOT_CONTAIN:
      return t`doesn't contain any of`;
    case ViewFilterOperand.GREATER_THAN_OR_EQUAL:
      return t`is more than or equal to`;
    case ViewFilterOperand.LESS_THAN_OR_EQUAL:
      return t`is less than or equal to`;
    case ViewFilterOperand.IS_BEFORE:
      return t`is before`;
    case ViewFilterOperand.IS_AFTER:
      return t`is after`;
    case ViewFilterOperand.IS:
      return isListFilter ? t`is any of` : t`is equal to`;
    case ViewFilterOperand.IS_NOT:
      return isListFilter ? t`is none of` : t`is not equal to`;
    case ViewFilterOperand.IS_NOT_NULL:
      return t`is known`;
    case ViewFilterOperand.IS_EMPTY:
      return t`is unknown`;
    case ViewFilterOperand.IS_NOT_EMPTY:
      return t`is known`;
    case ViewFilterOperand.IS_RELATIVE:
      return t`is in the last / next`;
    case ViewFilterOperand.IS_IN_PAST:
      return t`is in the past`;
    case ViewFilterOperand.IS_IN_FUTURE:
      return t`is in the future`;
    case ViewFilterOperand.IS_TODAY:
      return t`Today${timeZoneAbbreviationSuffix}`;
    default:
      return '';
  }
};

export const getOperandLabelShort = (
  operand: ViewFilterOperand | null | undefined,
  timeZoneAbbreviation?: string | null | undefined,
) => {
  const shouldDisplayTimeZoneAbbreviation =
    isNonEmptyString(timeZoneAbbreviation);

  const timeZoneAbbreviationSuffix = shouldDisplayTimeZoneAbbreviation
    ? ` (${timeZoneAbbreviation})`
    : '';

  switch (operand) {
    case ViewFilterOperand.IS:
    case ViewFilterOperand.CONTAINS:
      return ': ';
    case ViewFilterOperand.IS_NOT:
    case ViewFilterOperand.DOES_NOT_CONTAIN:
      return t`: Not`;
    case ViewFilterOperand.IS_NOT_NULL:
      return t`: is known`;
    case ViewFilterOperand.IS_NOT_EMPTY:
      return t`: is known`;
    case ViewFilterOperand.IS_EMPTY:
      return t`: is unknown`;
    case ViewFilterOperand.GREATER_THAN_OR_EQUAL:
      return '\u00A0≥ ';
    case ViewFilterOperand.LESS_THAN_OR_EQUAL:
      return '\u00A0≤ ';
    case ViewFilterOperand.IS_BEFORE:
      return '\u00A0< ';
    case ViewFilterOperand.IS_AFTER:
      return '\u00A0≥ ';
    case ViewFilterOperand.IS_IN_PAST:
      return t`: Past`;
    case ViewFilterOperand.IS_IN_FUTURE:
      return t`: Future`;
    case ViewFilterOperand.IS_TODAY:
      return t`: Today${timeZoneAbbreviationSuffix}`;
    default:
      return ': ';
  }
};
