import { FieldMetadataType } from '@/types/FieldMetadataType';
import { isDefined } from '@/utils/validation/isDefined';

const MICROS_PER_UNIT = 1_000_000;

const toTimestamp = (value: unknown) => {
  const timestamp =
    value instanceof Date ? value.getTime() : Date.parse(String(value));

  return Number.isNaN(timestamp) ? null : timestamp;
};

const toFormulaVariable = (value: unknown, fieldType: FieldMetadataType) => {
  // Lists stay as lists so that "x in field" keeps working on an empty multi-select.
  if (fieldType === FieldMetadataType.MULTI_SELECT) {
    return Array.isArray(value) ? value : [];
  }

  if (!isDefined(value) || value === '') {
    return null;
  }

  switch (fieldType) {
    case FieldMetadataType.DATE:
    case FieldMetadataType.DATE_TIME:
      return toTimestamp(value);
    case FieldMetadataType.NUMBER:
    case FieldMetadataType.NUMERIC: {
      const number = Number(value);

      return Number.isNaN(number) ? null : number;
    }
    case FieldMetadataType.CURRENCY: {
      const { amountMicros } = value as { amountMicros?: unknown };

      return {
        ...(value as object),
        amount: isDefined(amountMicros)
          ? Number(amountMicros) / MICROS_PER_UNIT
          : null,
      };
    }
    default:
      return value;
  }
};

export const buildFormulaVariables = (
  record: Record<string, unknown>,
  fields: { name: string; type: FieldMetadataType }[],
): Record<string, unknown> =>
  Object.fromEntries(
    fields.map(({ name, type }) => [
      name,
      toFormulaVariable(record[name], type),
    ]),
  );
