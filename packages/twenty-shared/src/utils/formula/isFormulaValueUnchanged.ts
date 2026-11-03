import { FieldMetadataType } from '@/types/FieldMetadataType';
import {
  type FormulaCurrencyValue,
  type FormulaOutputFieldType,
  type FormulaResultValue,
} from '@/utils/formula/coerceFormulaResult';
import { isDefined } from '@/utils/validation/isDefined';

const NUMBER_COMPARISON_TOLERANCE = 1e-9;

const areNumbersEqual = (left: number, right: number) =>
  Math.abs(left - right) <=
  NUMBER_COMPARISON_TOLERANCE * Math.max(1, Math.abs(left), Math.abs(right));

const toIsoDay = (value: unknown) =>
  value instanceof Date
    ? value.toISOString().slice(0, 10)
    : String(value).slice(0, 10);

const toTimestamp = (value: unknown) =>
  value instanceof Date ? value.getTime() : Date.parse(String(value));

// The ORM reads an empty text as '', an empty currency as a null amount, and numeric columns
// and timestamps in several shapes, so a strict comparison would rewrite on every run.
export const isFormulaValueUnchanged = (
  storedValue: unknown,
  computedValue: FormulaResultValue,
  outputType: FormulaOutputFieldType,
): boolean => {
  if (outputType === FieldMetadataType.CURRENCY) {
    const stored = storedValue as Partial<
      Record<keyof FormulaCurrencyValue, unknown>
    > | null;
    const storedAmount = stored?.amountMicros;
    const computed = computedValue as FormulaCurrencyValue | null;

    if (!isDefined(storedAmount) || !isDefined(computed)) {
      return !isDefined(storedAmount) && !isDefined(computed);
    }

    return (
      areNumbersEqual(Number(storedAmount), computed.amountMicros) &&
      stored?.currencyCode === computed.currencyCode
    );
  }

  if (!isDefined(storedValue) || storedValue === '') {
    return computedValue === null;
  }

  if (computedValue === null) {
    return false;
  }

  switch (outputType) {
    case FieldMetadataType.NUMBER:
      return (
        typeof computedValue === 'number' &&
        areNumbersEqual(Number(storedValue), computedValue)
      );
    case FieldMetadataType.DATE:
      return toIsoDay(storedValue) === computedValue;
    case FieldMetadataType.DATE_TIME:
      return toTimestamp(storedValue) === toTimestamp(computedValue);
    default:
      return storedValue === computedValue;
  }
};
