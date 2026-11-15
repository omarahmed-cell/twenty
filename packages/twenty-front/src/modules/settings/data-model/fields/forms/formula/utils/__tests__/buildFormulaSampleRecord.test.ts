import { buildFormulaSampleRecord } from '@/settings/data-model/fields/forms/formula/utils/buildFormulaSampleRecord';
import { buildFormulaVariables, evaluateFormula } from 'twenty-shared/utils';
import { FieldMetadataType } from '~/generated-metadata/graphql';

const RESEARCH_COMPLETION_INDEX =
  '(if(isEmpty(merchantType), 0, 1) + if(isEmpty(products), 0, 1) + if(isEmpty(operatesIn), 0, 1) + if(isEmpty(domainName.primaryLinkUrl), 0, 1) + if(isEmpty(linkedinLink.primaryLinkUrl), 0, 1) + if(isEmpty(doesDelivery), 0, 1) + if(isEmpty(noOfBranches), 0, 1)) / 7';

const field = (name: string, type: FieldMetadataType) => ({
  name,
  type,
  settings: null,
  defaultValue: null,
});

const RESEARCH_FIELDS = [
  field('merchantType', FieldMetadataType.SELECT),
  field('products', FieldMetadataType.MULTI_SELECT),
  field('operatesIn', FieldMetadataType.MULTI_SELECT),
  field('domainName', FieldMetadataType.LINKS),
  field('linkedinLink', FieldMetadataType.LINKS),
  field('doesDelivery', FieldMetadataType.BOOLEAN),
  field('noOfBranches', FieldMetadataType.NUMBER),
];

// Shaped like a company returned by the API.
const REAL_COMPANY = {
  merchantType: 'RESTAURANT',
  products: ['PRODUCT_A', 'PRODUCT_B'],
  operatesIn: [],
  domainName: {
    primaryLinkUrl: 'https://example.com',
    primaryLinkLabel: '',
    secondaryLinks: [],
  },
  linkedinLink: {
    primaryLinkUrl: '',
    primaryLinkLabel: '',
    secondaryLinks: null,
  },
  doesDelivery: null,
  noOfBranches: 0,
};

const SAMPLE_INPUTS = {
  merchantType: 'RESTAURANT',
  products: ['PRODUCT_A', 'PRODUCT_B'],
  operatesIn: [],
  'domainName.primaryLinkUrl': 'https://example.com',
  noOfBranches: '0',
};

const evaluate = (record: Record<string, unknown>) =>
  evaluateFormula(
    RESEARCH_COMPLETION_INDEX,
    buildFormulaVariables(record, RESEARCH_FIELDS),
  );

describe('buildFormulaSampleRecord', () => {
  it('gives the same result as the matching real record', () => {
    const sampleRecord = buildFormulaSampleRecord(
      RESEARCH_FIELDS,
      SAMPLE_INPUTS,
      RESEARCH_COMPLETION_INDEX,
    );

    expect(evaluate(sampleRecord)).toEqual(evaluate(REAL_COMPANY));
    expect(evaluate(sampleRecord)).toEqual({
      status: 'success',
      value: 4 / 7,
    });
  });

  it('builds the same variables as a real record for scalar and currency fields', () => {
    const fields = [
      field('merchantType', FieldMetadataType.SELECT),
      field('products', FieldMetadataType.MULTI_SELECT),
      field('noOfBranches', FieldMetadataType.NUMBER),
      field('doesDelivery', FieldMetadataType.BOOLEAN),
      field('foundedOn', FieldMetadataType.DATE),
      field('lastCallAt', FieldMetadataType.DATE_TIME),
      field('annualRevenue', FieldMetadataType.CURRENCY),
      field('notes', FieldMetadataType.TEXT),
    ];

    const realRecord = {
      merchantType: 'CAFE',
      products: ['PRODUCT_A'],
      noOfBranches: 12,
      doesDelivery: false,
      foundedOn: '2020-03-01',
      lastCallAt: '2026-11-15T09:30:00.000Z',
      annualRevenue: { amountMicros: 2_500_000_000, currencyCode: 'EUR' },
      notes: 'Busy at lunch',
    };

    const sampleRecord = buildFormulaSampleRecord(
      fields,
      {
        merchantType: 'CAFE',
        products: ['PRODUCT_A'],
        noOfBranches: '12',
        doesDelivery: 'false',
        foundedOn: '2020-03-01',
        lastCallAt: '2026-11-15T09:30:00.000Z',
        'annualRevenue.amount': '2500',
        'annualRevenue.currencyCode': 'EUR',
        notes: 'Busy at lunch',
      },
      '',
    );

    expect(buildFormulaVariables(sampleRecord, fields)).toEqual(
      buildFormulaVariables(realRecord, fields),
    );
  });

  it('treats untouched inputs like empty values on a real record', () => {
    const fields = [
      field('merchantType', FieldMetadataType.SELECT),
      field('products', FieldMetadataType.MULTI_SELECT),
      field('noOfBranches', FieldMetadataType.NUMBER),
      field('doesDelivery', FieldMetadataType.BOOLEAN),
      field('foundedOn', FieldMetadataType.DATE),
    ];

    expect(
      buildFormulaVariables(buildFormulaSampleRecord(fields, {}, ''), fields),
    ).toEqual(
      buildFormulaVariables(
        {
          merchantType: null,
          products: null,
          noOfBranches: null,
          doesDelivery: null,
          foundedOn: null,
        },
        fields,
      ),
    );
  });

  it('fills the composite sub-fields the formula uses', () => {
    const fields = [field('phones', FieldMetadataType.PHONES)];
    const expression = 'length(phones.primaryPhoneNumber)';

    const sampleRecord = buildFormulaSampleRecord(
      fields,
      { 'phones.primaryPhoneNumber': '5551234' },
      expression,
    );

    expect(
      evaluateFormula(expression, buildFormulaVariables(sampleRecord, fields)),
    ).toEqual({ status: 'success', value: 7 });
  });
});
