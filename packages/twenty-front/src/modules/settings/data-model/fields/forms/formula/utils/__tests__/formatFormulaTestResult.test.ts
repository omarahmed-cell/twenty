import { DateFormat } from '@/localization/constants/DateFormat';
import { NumberFormat } from '@/localization/constants/NumberFormat';
import { TimeFormat } from '@/localization/constants/TimeFormat';
import { formatFormulaTestResult } from '@/settings/data-model/fields/forms/formula/utils/formatFormulaTestResult';
import { enUS } from 'date-fns/locale';
import { FieldMetadataType } from '~/generated-metadata/graphql';

const context = {
  numberFormat: NumberFormat.COMMAS_AND_DOT,
  dateFormat: DateFormat.MONTH_FIRST,
  timeFormat: TimeFormat.HOUR_24,
  timeZone: 'UTC',
  localeCatalog: enUS,
};

describe('formatFormulaTestResult', () => {
  it('shows a percentage with the chosen decimals', () => {
    const value = 4 / 7;

    expect(
      formatFormulaTestResult({
        value,
        outputType: FieldMetadataType.NUMBER,
        settings: { type: 'percentage', decimals: 0 },
        context,
      }),
    ).toBe('57%');
    expect(
      formatFormulaTestResult({
        value,
        outputType: FieldMetadataType.NUMBER,
        settings: { type: 'percentage', decimals: 1 },
        context,
      }),
    ).toBe('57.1%');
  });

  it('shows a plain number with its decimals', () => {
    expect(
      formatFormulaTestResult({
        value: 1234.5678,
        outputType: FieldMetadataType.NUMBER,
        settings: { type: 'number', decimals: 2 },
        context,
      }),
    ).toBe('1,234.57');
  });

  it('shows a currency amount with its code', () => {
    expect(
      formatFormulaTestResult({
        value: { amountMicros: 1_500_250_000, currencyCode: 'EUR' },
        outputType: FieldMetadataType.CURRENCY,
        settings: { format: 'number', decimals: 2 },
        context,
      }),
    ).toBe('1,500.25 EUR');
  });

  it('shows a date in the workspace date format', () => {
    expect(
      formatFormulaTestResult({
        value: '2026-11-15',
        outputType: FieldMetadataType.DATE,
        settings: { displayFormat: undefined },
        context,
      }),
    ).toBe('Nov 15, 2026');
  });

  it('shows the label of a select option', () => {
    expect(
      formatFormulaTestResult({
        value: 'RESTAURANT',
        outputType: FieldMetadataType.SELECT,
        options: [
          { value: 'CAFE', label: 'Cafe' },
          { value: 'RESTAURANT', label: 'Restaurant' },
        ],
        context,
      }),
    ).toBe('Restaurant');
  });

  it('shows Yes or No for true/false', () => {
    expect(
      formatFormulaTestResult({
        value: true,
        outputType: FieldMetadataType.BOOLEAN,
        context,
      }),
    ).toBe('Yes');
    expect(
      formatFormulaTestResult({
        value: false,
        outputType: FieldMetadataType.BOOLEAN,
        context,
      }),
    ).toBe('No');
  });
});
