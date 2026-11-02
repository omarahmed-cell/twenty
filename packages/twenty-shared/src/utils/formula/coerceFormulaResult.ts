import { FieldMetadataType } from '@/types/FieldMetadataType';
import { isDefined } from '@/utils/validation/isDefined';

export const FORMULA_OUTPUT_FIELD_TYPES = [
  FieldMetadataType.NUMBER,
  FieldMetadataType.TEXT,
  FieldMetadataType.BOOLEAN,
] as const;

export type FormulaOutputFieldType =
  (typeof FORMULA_OUTPUT_FIELD_TYPES)[number];

export type CoercedFormulaResult =
  | { status: 'success'; value: number | string | boolean | null }
  | { status: 'error'; error: string };

const describeValue = (value: unknown) =>
  Array.isArray(value) ? 'a list' : `a ${typeof value}`;

export const coerceFormulaResult = (
  value: unknown,
  outputType: FormulaOutputFieldType,
): CoercedFormulaResult => {
  if (!isDefined(value)) {
    return { status: 'success', value: null };
  }

  if (outputType === FieldMetadataType.NUMBER) {
    return typeof value === 'number'
      ? { status: 'success', value: Number.isFinite(value) ? value : null }
      : {
          status: 'error',
          error: `Expected a number, got ${describeValue(value)}.`,
        };
  }

  if (outputType === FieldMetadataType.BOOLEAN) {
    return typeof value === 'boolean'
      ? { status: 'success', value }
      : {
          status: 'error',
          error: `Expected true or false, got ${describeValue(value)}.`,
        };
  }

  if (typeof value === 'number' && !Number.isFinite(value)) {
    return { status: 'success', value: null };
  }

  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return { status: 'success', value: value === '' ? null : String(value) };
  }

  return {
    status: 'error',
    error: `Expected text, got ${describeValue(value)}.`,
  };
};
