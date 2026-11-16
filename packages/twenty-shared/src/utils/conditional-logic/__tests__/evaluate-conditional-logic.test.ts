import { FieldMetadataType } from '@/types/FieldMetadataType';
import { getConditionalLogicOperators } from '@/utils/conditional-logic/conditional-logic-operators';
import {
  type ConditionalLogicConditionValue,
  type ConditionalLogicField,
  type ConditionalLogicOperator,
  type ConditionalLogicRule,
} from '@/utils/conditional-logic/conditional-logic-types';
import {
  evaluateConditionalLogicCondition,
  findMissingConditionalLogicProperties,
  resolveConditionalLogicProperties,
} from '@/utils/conditional-logic/evaluate-conditional-logic';
import { normalizeConditionalLogicRules } from '@/utils/conditional-logic/normalize-conditional-logic-rules';

const FIELDS: ConditionalLogicField[] = [
  { name: 'name', label: 'Name', type: FieldMetadataType.TEXT },
  { name: 'dealType', label: 'Deal Type', type: FieldMetadataType.SELECT },
  { name: 'tags', label: 'Tags', type: FieldMetadataType.MULTI_SELECT },
  { name: 'seats', label: 'Seats', type: FieldMetadataType.NUMBER },
  { name: 'amount', label: 'Amount', type: FieldMetadataType.CURRENCY },
  { name: 'closeDate', label: 'Close Date', type: FieldMetadataType.DATE },
  {
    name: 'signedAt',
    label: 'Signed At',
    type: FieldMetadataType.DATE_TIME,
  },
  { name: 'isRenewal', label: 'Is Renewal', type: FieldMetadataType.BOOLEAN },
  {
    name: 'owner',
    label: 'Owner',
    type: FieldMetadataType.RELATION,
    joinColumnName: 'ownerId',
  },
  {
    name: 'closedLostReason',
    label: 'Closed Lost Reason',
    type: FieldMetadataType.SELECT,
  },
  {
    name: 'closedLostContext',
    label: 'Closed Lost Context',
    type: FieldMetadataType.TEXT,
  },
];

const FIELD_BY_NAME = new Map(FIELDS.map((field) => [field.name, field]));

const DEAL = {
  name: 'Acme Renewal',
  dealType: 'NEW_BUSINESS',
  tags: ['HOT', 'EMEA'],
  seats: 40,
  amount: { amountMicros: 25_000_000_000, currencyCode: 'USD' },
  closeDate: '2026-11-16',
  signedAt: '2026-11-16T22:30:00.000Z',
  isRenewal: false,
  ownerId: 'member-1',
  closedLostReason: null,
  closedLostContext: '',
};

const matches = (
  fieldName: string,
  operator: ConditionalLogicOperator,
  value?: ConditionalLogicConditionValue,
  record: Record<string, unknown> = DEAL,
) =>
  evaluateConditionalLogicCondition({
    condition: { id: 'c', fieldName, operator, value },
    record,
    fieldByName: FIELD_BY_NAME,
  });

describe('evaluateConditionalLogicCondition', () => {
  it('handles is known and is unknown on any field, composites included', () => {
    expect(matches('dealType', 'IS_KNOWN')).toBe(true);
    expect(matches('closedLostReason', 'IS_UNKNOWN')).toBe(true);
    expect(matches('closedLostContext', 'IS_UNKNOWN')).toBe(true);
    expect(
      matches('amount', 'IS_UNKNOWN', null, {
        amount: { amountMicros: null, currencyCode: 'USD' },
      }),
    ).toBe(true);
    expect(matches('owner', 'IS_KNOWN')).toBe(true);
  });

  it('compares text case-insensitively', () => {
    expect(matches('name', 'IS_EQUAL_TO', 'acme renewal')).toBe(true);
    expect(matches('name', 'IS_NOT_EQUAL_TO', 'Globex')).toBe(true);
    expect(matches('name', 'CONTAINS', 'RENEW')).toBe(true);
    expect(matches('name', 'CONTAINS', 'lost')).toBe(false);
  });

  it('checks a select against a list of options', () => {
    expect(matches('dealType', 'IS_ANY_OF', ['NEW_BUSINESS'])).toBe(true);
    expect(matches('dealType', 'IS_ANY_OF', ['EXISTING_BUSINESS'])).toBe(false);
    expect(matches('dealType', 'IS_NONE_OF', ['EXISTING_BUSINESS'])).toBe(true);
    expect(matches('closedLostReason', 'IS_NONE_OF', ['NO_BUDGET'])).toBe(true);
  });

  it('checks a multi-select with any, all and none', () => {
    expect(matches('tags', 'CONTAINS_ANY_OF', ['HOT', 'COLD'])).toBe(true);
    expect(matches('tags', 'CONTAINS_ALL_OF', ['HOT', 'EMEA'])).toBe(true);
    expect(matches('tags', 'CONTAINS_ALL_OF', ['HOT', 'COLD'])).toBe(false);
    expect(matches('tags', 'CONTAINS_NONE_OF', ['COLD'])).toBe(true);
    expect(matches('tags', 'CONTAINS_NONE_OF', ['EMEA'])).toBe(false);
  });

  it('compares numbers and currency amounts in units', () => {
    expect(matches('seats', 'IS_EQUAL_TO', 40)).toBe(true);
    expect(matches('seats', 'IS_NOT_EQUAL_TO', 40)).toBe(false);
    expect(matches('seats', 'GREATER_THAN', 39)).toBe(true);
    expect(matches('seats', 'LESS_THAN', 40)).toBe(false);
    expect(matches('seats', 'GREATER_THAN_OR_EQUAL', 40)).toBe(true);
    expect(matches('seats', 'LESS_THAN_OR_EQUAL', 39)).toBe(false);
    expect(matches('amount', 'GREATER_THAN_OR_EQUAL', 25000)).toBe(true);
    expect(matches('amount', 'LESS_THAN', 25000)).toBe(false);
    expect(matches('seats', 'GREATER_THAN', 1, { seats: null })).toBe(false);
  });

  it('compares dates by day, date-times by UTC day', () => {
    expect(matches('closeDate', 'IS_ON', '2026-11-16')).toBe(true);
    expect(matches('closeDate', 'IS_BEFORE', '2026-12-01')).toBe(true);
    expect(matches('closeDate', 'IS_AFTER', '2026-12-01')).toBe(false);
    expect(matches('signedAt', 'IS_ON', '2026-11-16')).toBe(true);
    expect(matches('signedAt', 'IS_AFTER', '2026-11-15')).toBe(true);
  });

  it('checks booleans and relations', () => {
    expect(matches('isRenewal', 'IS_NO')).toBe(true);
    expect(matches('isRenewal', 'IS_YES')).toBe(false);
    expect(matches('owner', 'IS_ANY_OF', ['member-1', 'member-2'])).toBe(true);
    expect(
      matches('owner', 'IS_ANY_OF', ['member-2'], {
        owner: { id: 'member-2' },
      }),
    ).toBe(true);
  });

  it('never matches a condition on a field that no longer exists', () => {
    expect(matches('deletedField', 'IS_UNKNOWN')).toBe(false);
  });
});

describe('getConditionalLogicOperators', () => {
  it('offers the operators of each field type', () => {
    expect(
      getConditionalLogicOperators({ type: FieldMetadataType.TEXT }),
    ).toEqual([
      'IS_EQUAL_TO',
      'IS_NOT_EQUAL_TO',
      'CONTAINS',
      'IS_KNOWN',
      'IS_UNKNOWN',
    ]);
    expect(
      getConditionalLogicOperators({ type: FieldMetadataType.BOOLEAN }),
    ).toEqual(['IS_YES', 'IS_NO']);
    expect(
      getConditionalLogicOperators({ type: FieldMetadataType.RICH_TEXT }),
    ).toEqual(['IS_KNOWN', 'IS_UNKNOWN']);
  });
});

const rule = (
  conditionGroups: ConditionalLogicRule['conditionGroups'],
  properties: ConditionalLogicRule['properties'],
): ConditionalLogicRule => ({ id: 'rule', conditionGroups, properties });

describe('resolveConditionalLogicProperties', () => {
  const newBusiness = {
    id: 'g1',
    conditions: [
      {
        id: 'c1',
        fieldName: 'dealType',
        operator: 'IS_ANY_OF' as const,
        value: ['NEW_BUSINESS'],
      },
      {
        id: 'c2',
        fieldName: 'seats',
        operator: 'GREATER_THAN' as const,
        value: 100,
      },
    ],
  };
  const renewal = {
    id: 'g2',
    conditions: [
      { id: 'c3', fieldName: 'isRenewal', operator: 'IS_NO' as const },
    ],
  };

  it('ANDs conditions within a group and ORs groups', () => {
    const properties = [{ fieldName: 'closedLostReason', isRequired: true }];

    expect(
      resolveConditionalLogicProperties({
        rules: [rule([newBusiness], properties)],
        record: DEAL,
        fields: FIELDS,
      }),
    ).toEqual([]);
    expect(
      resolveConditionalLogicProperties({
        rules: [rule([newBusiness, renewal], properties)],
        record: DEAL,
        fields: FIELDS,
      }),
    ).toEqual(properties);
  });

  it('applies a rule with no extra conditions', () => {
    expect(
      resolveConditionalLogicProperties({
        rules: [
          rule([], [{ fieldName: 'closedLostContext', isRequired: false }]),
        ],
        record: DEAL,
        fields: FIELDS,
      }),
    ).toEqual([{ fieldName: 'closedLostContext', isRequired: false }]);
  });
});

describe('findMissingConditionalLogicProperties', () => {
  const closedLost = rule(
    [{ id: 'g', conditions: [] }],
    [
      { fieldName: 'closedLostReason', isRequired: true },
      { fieldName: 'closedLostContext', isRequired: false },
    ],
  );

  it('reports only empty required properties', () => {
    expect(
      findMissingConditionalLogicProperties({
        rules: [closedLost],
        record: DEAL,
        fields: FIELDS,
      }).map(({ label }) => label),
    ).toEqual(['Closed Lost Reason']);
    expect(
      findMissingConditionalLogicProperties({
        rules: [closedLost],
        record: { ...DEAL, closedLostReason: 'NO_BUDGET' },
        fields: FIELDS,
      }),
    ).toEqual([]);
  });
});

describe('normalizeConditionalLogicRules', () => {
  it('drops malformed entries and defaults properties to required', () => {
    expect(
      normalizeConditionalLogicRules([
        null,
        { id: 'r', properties: [{ fieldName: 'closedLostReason' }, {}] },
        {
          id: 'r2',
          conditionGroups: [
            {
              id: 'g',
              conditions: [{ id: 'c', fieldName: 'x', operator: 'NOPE' }],
            },
          ],
        },
      ]),
    ).toEqual([
      {
        id: 'r',
        conditionGroups: [],
        properties: [{ fieldName: 'closedLostReason', isRequired: true }],
      },
      {
        id: 'r2',
        conditionGroups: [{ id: 'g', conditions: [] }],
        properties: [],
      },
    ]);
    expect(normalizeConditionalLogicRules('nope')).toEqual([]);
  });
});
