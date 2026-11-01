import { isNonEmptyString } from '@sniptt/guards';
import { FieldMetadataType } from 'twenty-shared/types';
import { isDefined, isPlainObject } from 'twenty-shared/utils';

const joinNonEmpty = (parts: unknown[], separator: string) => {
  const text = parts.filter(isNonEmptyString).join(separator).trim();

  return text === '' ? null : text;
};

const formatAsText = (
  sourceFieldType: FieldMetadataType,
  value: unknown,
): string | null => {
  if (!isPlainObject(value)) {
    return isNonEmptyString(value) ||
      typeof value === 'number' ||
      typeof value === 'boolean'
      ? String(value)
      : null;
  }

  switch (sourceFieldType) {
    case FieldMetadataType.FULL_NAME:
      return joinNonEmpty([value.firstName, value.lastName], ' ');
    case FieldMetadataType.EMAILS:
      return joinNonEmpty([value.primaryEmail], '');
    case FieldMetadataType.LINKS:
      return joinNonEmpty([value.primaryLinkUrl], '');
    case FieldMetadataType.PHONES:
      return joinNonEmpty(
        [value.primaryPhoneCallingCode, value.primaryPhoneNumber],
        ' ',
      );
    case FieldMetadataType.CURRENCY: {
      const amountMicros = Number(value.amountMicros);

      return isDefined(value.amountMicros) && Number.isFinite(amountMicros)
        ? joinNonEmpty(
            [String(amountMicros / 1_000_000), value.currencyCode],
            ' ',
          )
        : null;
    }
    case FieldMetadataType.ADDRESS:
      return joinNonEmpty(
        [
          value.addressStreet1,
          value.addressStreet2,
          value.addressCity,
          value.addressState,
          value.addressPostcode,
          value.addressCountry,
        ],
        ', ',
      );
    default:
      return null;
  }
};

export const formatSyncedValue = ({
  sourceFieldType,
  value,
}: {
  sourceFieldType: FieldMetadataType;
  value: unknown;
}): unknown => {
  if (!isDefined(value)) {
    return null;
  }

  switch (sourceFieldType) {
    case FieldMetadataType.SELECT:
      return isNonEmptyString(value) ? value : null;
    case FieldMetadataType.MULTI_SELECT:
      return Array.isArray(value) && value.length > 0 ? value : null;
    default:
      return formatAsText(sourceFieldType, value);
  }
};
