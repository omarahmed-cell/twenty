import { FieldMetadataType } from '@/types/FieldMetadataType';
import { type FormulaOutputFieldType } from '@/utils/formula/coerceFormulaResult';
import { isDefined } from '@/utils/validation/isDefined';

const NUMBER_COMPARISON_TOLERANCE = 1e-9;

// The ORM reads an empty text as '' and numeric columns can come back as strings,
// so a strict comparison would rewrite the record on every run.
const normalizeStoredValue = (
  value: unknown,
  outputType: FormulaOutputFieldType,
) => {
  if (!isDefined(value) || value === '') {
    return null;
  }

  return outputType === FieldMetadataType.NUMBER ? Number(value) : value;
};

export const isFormulaValueUnchanged = (
  storedValue: unknown,
  computedValue: number | string | boolean | null,
  outputType: FormulaOutputFieldType,
) => {
  const stored = normalizeStoredValue(storedValue, outputType);

  if (typeof stored === 'number' && typeof computedValue === 'number') {
    return (
      Math.abs(stored - computedValue) <=
      NUMBER_COMPARISON_TOLERANCE *
        Math.max(1, Math.abs(stored), Math.abs(computedValue))
    );
  }

  return stored === computedValue;
};
