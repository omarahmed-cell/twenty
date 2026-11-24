import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { formatRoboostDate } from '@/roboost-app/utils/formatRoboostDate';
import {
  formatRoboostPercentage,
  isRoboostPercentageField,
} from '@/roboost-app/utils/formatRoboostPercentage';
import { getRoboostDomainLabel } from '@/roboost-app/utils/getRoboostDomainLabel';
import { getRoboostPersonName } from '@/roboost-app/utils/getRoboostPersonName';
import { isNonEmptyString, isNumber, isString } from '@sniptt/guards';
import { isDefined } from 'twenty-shared/utils';
import { FieldMetadataType } from '~/generated-metadata/graphql';

const EMPTY = '—';

type CompositeValue = Record<string, unknown>;

const asComposite = (value: unknown): CompositeValue | undefined =>
  typeof value === 'object' && value !== null
    ? (value as CompositeValue)
    : undefined;

const getOptionLabel = (fieldMetadataItem: FieldMetadataItem, value: string) =>
  fieldMetadataItem.options?.find((option) => option.value === value)?.label ??
  value;

const getRelatedRecordLabel = (value: unknown) => {
  const record = asComposite(value);
  const name = record?.name;

  if (isString(name)) {
    return name;
  }

  const fullName = getRoboostPersonName(
    asComposite(name) as { firstName?: string; lastName?: string } | undefined,
  );

  return isNonEmptyString(fullName)
    ? fullName
    : isString(record?.title)
      ? record.title
      : '';
};

// Read-only display text for the record panel's label-above-value properties
export const formatRoboostFieldValue = (
  fieldMetadataItem: FieldMetadataItem,
  value: unknown,
): string => {
  if (!isDefined(value) || value === '') {
    return EMPTY;
  }

  const composite = asComposite(value);

  switch (fieldMetadataItem.type) {
    case FieldMetadataType.SELECT:
      return isString(value) ? getOptionLabel(fieldMetadataItem, value) : EMPTY;
    case FieldMetadataType.MULTI_SELECT:
      return Array.isArray(value) && value.length > 0
        ? value
            .map((item) => getOptionLabel(fieldMetadataItem, String(item)))
            .join(', ')
        : EMPTY;
    case FieldMetadataType.DATE:
    case FieldMetadataType.DATE_TIME:
      return formatRoboostDate(String(value));
    case FieldMetadataType.BOOLEAN:
      return value === true ? 'Yes' : 'No';
    case FieldMetadataType.NUMBER:
    case FieldMetadataType.NUMERIC:
      if (!isNumber(value)) {
        return String(value);
      }

      return isRoboostPercentageField(fieldMetadataItem)
        ? formatRoboostPercentage(value)
        : value.toLocaleString('en-US');
    case FieldMetadataType.LINKS: {
      const label = getRoboostDomainLabel(
        composite?.primaryLinkUrl as string | null | undefined,
      );

      return isNonEmptyString(label) ? label : EMPTY;
    }
    case FieldMetadataType.EMAILS:
      return isNonEmptyString(composite?.primaryEmail)
        ? composite.primaryEmail
        : EMPTY;
    case FieldMetadataType.PHONES: {
      const number = composite?.primaryPhoneNumber;
      const callingCode = composite?.primaryPhoneCallingCode;

      return isNonEmptyString(number)
        ? [callingCode, number].filter(isNonEmptyString).join(' ')
        : EMPTY;
    }
    case FieldMetadataType.CURRENCY: {
      const amountMicros = composite?.amountMicros;

      if (!isNumber(amountMicros)) {
        return EMPTY;
      }
      const amount = (amountMicros / 1_000_000).toLocaleString('en-US');

      return isNonEmptyString(composite?.currencyCode)
        ? `${composite.currencyCode} ${amount}`
        : amount;
    }
    case FieldMetadataType.FULL_NAME: {
      const name = getRoboostPersonName(
        composite as { firstName?: string; lastName?: string },
      );

      return isNonEmptyString(name) ? name : EMPTY;
    }
    case FieldMetadataType.ADDRESS: {
      const parts = [
        composite?.addressStreet1,
        composite?.addressCity,
        composite?.addressCountry,
      ].filter(isNonEmptyString);

      return parts.length > 0 ? parts.join(', ') : EMPTY;
    }
    case FieldMetadataType.RICH_TEXT: {
      const markdown = composite?.markdown;

      return isNonEmptyString(markdown) ? markdown.slice(0, 160) : EMPTY;
    }
    case FieldMetadataType.ACTOR:
      return isNonEmptyString(composite?.name) ? composite.name : EMPTY;
    case FieldMetadataType.RELATION: {
      const label = getRelatedRecordLabel(value);

      return isNonEmptyString(label) ? label : EMPTY;
    }
    case FieldMetadataType.ARRAY:
      return Array.isArray(value) && value.length > 0
        ? value.join(', ')
        : EMPTY;
    default:
      return isString(value) || isNumber(value) ? String(value) : EMPTY;
  }
};
