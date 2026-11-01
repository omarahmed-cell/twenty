import { FieldMetadataType } from 'twenty-shared/types';

import { formatSyncedValue } from 'src/modules/field-sync/utils/format-synced-value.util';

describe('formatSyncedValue', () => {
  it.each([
    {
      sourceFieldType: FieldMetadataType.SELECT,
      value: 'EGYPT',
      expected: 'EGYPT',
    },
    {
      sourceFieldType: FieldMetadataType.MULTI_SELECT,
      value: ['EGYPT', 'SAUDI_ARABIA'],
      expected: ['EGYPT', 'SAUDI_ARABIA'],
    },
    {
      sourceFieldType: FieldMetadataType.MULTI_SELECT,
      value: [],
      expected: null,
    },
    {
      sourceFieldType: FieldMetadataType.TEXT,
      value: 'Riyadh',
      expected: 'Riyadh',
    },
    { sourceFieldType: FieldMetadataType.TEXT, value: '', expected: null },
    { sourceFieldType: FieldMetadataType.NUMBER, value: 42, expected: '42' },
    {
      sourceFieldType: FieldMetadataType.BOOLEAN,
      value: false,
      expected: 'false',
    },
    {
      sourceFieldType: FieldMetadataType.FULL_NAME,
      value: { firstName: 'Mona', lastName: 'Adel' },
      expected: 'Mona Adel',
    },
    {
      sourceFieldType: FieldMetadataType.EMAILS,
      value: { primaryEmail: 'mona@roboost.app', additionalEmails: [] },
      expected: 'mona@roboost.app',
    },
    {
      sourceFieldType: FieldMetadataType.CURRENCY,
      value: { amountMicros: '2500000000', currencyCode: 'SAR' },
      expected: '2500 SAR',
    },
    {
      sourceFieldType: FieldMetadataType.ADDRESS,
      value: {
        addressCity: 'Riyadh',
        addressCountry: 'Saudi Arabia',
        addressStreet1: '',
      },
      expected: 'Riyadh, Saudi Arabia',
    },
    { sourceFieldType: FieldMetadataType.TEXT, value: null, expected: null },
  ])(
    'formats $sourceFieldType $value',
    ({ sourceFieldType, value, expected }) => {
      expect(formatSyncedValue({ sourceFieldType, value })).toEqual(expected);
    },
  );
});
