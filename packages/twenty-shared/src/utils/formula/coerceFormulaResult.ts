import { FieldMetadataType } from '@/types/FieldMetadataType';
import { isDefined } from '@/utils/validation/isDefined';

const MICROS_PER_UNIT = 1_000_000;

export const FORMULA_OUTPUT_FIELD_TYPES = [
  FieldMetadataType.NUMBER,
  FieldMetadataType.TEXT,
  FieldMetadataType.BOOLEAN,
  FieldMetadataType.DATE,
  FieldMetadataType.DATE_TIME,
  FieldMetadataType.SELECT,
  FieldMetadataType.CURRENCY,
] as const;

export type FormulaOutputFieldType =
  (typeof FORMULA_OUTPUT_FIELD_TYPES)[number];

export type FormulaCurrencyValue = {
  amountMicros: number;
  currencyCode: string;
};

export type FormulaResultValue =
  | number
  | string
  | boolean
  | FormulaCurrencyValue
  | null;

export type CoercedFormulaResult =
  | { status: 'success'; value: FormulaResultValue }
  | { status: 'error'; error: string };

export type FormulaOutputConfig = {
  optionValues?: string[];
  currencyCode?: string;
};

const DEFAULT_CURRENCY_CODE = 'USD';

const describeValue = (value: unknown) =>
  Array.isArray(value) ? 'a list' : `a ${typeof value}`;

const error = (expected: string, value: unknown): CoercedFormulaResult => ({
  status: 'error',
  error: `Expected ${expected}, got ${describeValue(value)}.`,
});

const success = (value: FormulaResultValue): CoercedFormulaResult => ({
  status: 'success',
  value,
});

const coerceDate = (
  value: unknown,
  toStoredFormat: (date: Date) => string,
): CoercedFormulaResult => {
  if (typeof value === 'number' && !Number.isFinite(value)) {
    return success(null);
  }

  if (typeof value !== 'number' && typeof value !== 'string') {
    return error('a date', value);
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? { status: 'error', error: `"${value}" is not a date.` }
    : success(toStoredFormat(date));
};

export const coerceFormulaResult = (
  value: unknown,
  outputType: FormulaOutputFieldType,
  { optionValues = [], currencyCode }: FormulaOutputConfig = {},
): CoercedFormulaResult => {
  if (!isDefined(value)) {
    return success(null);
  }

  switch (outputType) {
    case FieldMetadataType.NUMBER:
      return typeof value === 'number'
        ? success(Number.isFinite(value) ? value : null)
        : error('a number', value);
    case FieldMetadataType.CURRENCY:
      if (typeof value !== 'number') {
        return error('an amount', value);
      }

      return success(
        Number.isFinite(value)
          ? {
              amountMicros: Math.round(value * MICROS_PER_UNIT),
              currencyCode: currencyCode ?? DEFAULT_CURRENCY_CODE,
            }
          : null,
      );
    case FieldMetadataType.BOOLEAN:
      return typeof value === 'boolean'
        ? success(value)
        : error('true or false', value);
    case FieldMetadataType.DATE:
      return coerceDate(value, (date) => date.toISOString().slice(0, 10));
    case FieldMetadataType.DATE_TIME:
      return coerceDate(value, (date) => date.toISOString());
    case FieldMetadataType.SELECT:
      if (typeof value !== 'string') {
        return error('an option value', value);
      }

      if (value === '') {
        return success(null);
      }

      return optionValues.includes(value)
        ? success(value)
        : {
            status: 'error',
            error: `"${value}" is not one of this field's options.`,
          };
    case FieldMetadataType.TEXT:
      if (typeof value === 'number' && !Number.isFinite(value)) {
        return success(null);
      }

      if (
        typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean'
      ) {
        return success(value === '' ? null : String(value));
      }

      return error('text', value);
  }
};
