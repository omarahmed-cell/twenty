import { DEFAULT_DECIMAL_VALUE } from '@/localization/utils/formatNumber';
import { type FormulaOutputFieldType } from 'twenty-shared/utils';
import { FieldMetadataType } from '~/generated-metadata/graphql';

const DEFAULT_CURRENCY_CODE = "'USD'";

// One object satisfies every output's settings schema; each schema keeps only what it reads.
export const FORMULA_FORM_DEFAULT_SETTINGS = {
  displayedMaxRows: null,
  type: 'number',
  decimals: DEFAULT_DECIMAL_VALUE,
  format: 'short',
  displayFormat: 'USER_SETTINGS',
};

export const getFormulaFormDefaultValue = (
  outputType: FormulaOutputFieldType,
) => {
  switch (outputType) {
    case FieldMetadataType.BOOLEAN:
      return false;
    case FieldMetadataType.CURRENCY:
      return { amountMicros: null, currencyCode: DEFAULT_CURRENCY_CODE };
    default:
      return null;
  }
};
