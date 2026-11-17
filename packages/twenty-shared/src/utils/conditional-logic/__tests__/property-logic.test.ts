import { FieldMetadataType } from '@/types/FieldMetadataType';
import {
  type ConditionalLogicField,
  type ConditionalLogicRule,
} from '@/utils/conditional-logic/conditional-logic-types';
import {
  describePropertyLogicTrigger,
  expandPropertyLogicRule,
  findPropertyLogicRuleViolations,
  formatPropertyLogicViolationMessage,
  getPropertyGroupIdFromReference,
  resolveHiddenPropertyFieldNames,
  toPropertyGroupReference,
} from '@/utils/conditional-logic/property-logic';

const FIELDS: ConditionalLogicField[] = [
  {
    name: 'products',
    label: 'Products',
    type: FieldMetadataType.MULTI_SELECT,
    options: [
      { value: 'DMS', label: 'DMS' },
      { value: 'SIRA', label: 'Sira' },
    ],
  },
  {
    name: 'usesAggregators',
    label: 'Uses Aggregators',
    type: FieldMetadataType.MULTI_SELECT,
  },
  { name: 'uses3pls', label: 'Uses 3PLs', type: FieldMetadataType.SELECT },
  { name: 'notes', label: 'Notes', type: FieldMetadataType.TEXT },
];

const DMS_GROUP_ID = 'dms-group';

const FIELD_NAMES_BY_GROUP_ID = new Map([
  [DMS_GROUP_ID, ['usesAggregators', 'uses3pls']],
]);

const DMS_RULE: ConditionalLogicRule = {
  id: 'dms-rule',
  conditionGroups: [
    {
      id: 'group-1',
      conditions: [
        {
          id: 'condition-1',
          fieldName: 'products',
          operator: 'CONTAINS_ANY_OF',
          value: ['DMS'],
        },
      ],
    },
  ],
  properties: [
    { fieldName: toPropertyGroupReference(DMS_GROUP_ID), isRequired: true },
  ],
};

const EXPANDED_DMS_RULE = expandPropertyLogicRule(
  DMS_RULE,
  FIELD_NAMES_BY_GROUP_ID,
);

describe('property group references', () => {
  it('round-trips a group id', () => {
    expect(
      getPropertyGroupIdFromReference(toPropertyGroupReference('abc')),
    ).toBe('abc');
    expect(getPropertyGroupIdFromReference('usesAggregators')).toBeNull();
  });
});

describe('expandPropertyLogicRule', () => {
  it('replaces a group with its fields and applies the group Required to each', () => {
    expect(EXPANDED_DMS_RULE.properties).toEqual([
      { fieldName: 'usesAggregators', isRequired: true },
      { fieldName: 'uses3pls', isRequired: true },
    ]);
  });

  it('keeps a field required when any entry requires it', () => {
    const expanded = expandPropertyLogicRule(
      {
        ...DMS_RULE,
        properties: [
          { fieldName: 'uses3pls', isRequired: false },
          {
            fieldName: toPropertyGroupReference(DMS_GROUP_ID),
            isRequired: true,
          },
          { fieldName: 'notes', isRequired: false },
        ],
      },
      FIELD_NAMES_BY_GROUP_ID,
    );

    expect(expanded.properties).toEqual([
      { fieldName: 'uses3pls', isRequired: true },
      { fieldName: 'usesAggregators', isRequired: true },
      { fieldName: 'notes', isRequired: false },
    ]);
  });

  it('drops a deleted group without failing', () => {
    expect(expandPropertyLogicRule(DMS_RULE, new Map()).properties).toEqual([]);
  });
});

describe('resolveHiddenPropertyFieldNames', () => {
  it('hides the dependents while no rule is true', () => {
    expect(
      resolveHiddenPropertyFieldNames({
        expandedRules: [EXPANDED_DMS_RULE],
        record: { products: null, usesAggregators: ['TALABAT'] },
        fields: FIELDS,
      }),
    ).toEqual(new Set(['usesAggregators', 'uses3pls']));
  });

  it('shows the dependents as soon as the rule is true', () => {
    expect(
      resolveHiddenPropertyFieldNames({
        expandedRules: [EXPANDED_DMS_RULE],
        record: { products: ['SIRA', 'DMS'] },
        fields: FIELDS,
      }),
    ).toEqual(new Set());
  });

  it('never hides a field that no rule depends on', () => {
    expect(
      resolveHiddenPropertyFieldNames({
        expandedRules: [EXPANDED_DMS_RULE],
        record: {},
        fields: FIELDS,
      }).has('notes'),
    ).toBe(false);
  });
});

describe('findPropertyLogicRuleViolations', () => {
  it('refuses a change that makes the rule true with required dependents empty', () => {
    const violations = findPropertyLogicRuleViolations({
      expandedRules: [EXPANDED_DMS_RULE],
      previousRecord: { products: ['SIRA'] },
      nextRecord: { products: ['DMS'], uses3pls: 'CERVO_DELIVERY' },
      fields: FIELDS,
    });

    expect(violations).toHaveLength(1);
    expect(violations[0].missingFields.map(({ name }) => name)).toEqual([
      'usesAggregators',
    ]);
  });

  it('allows the change once every required dependent is filled', () => {
    expect(
      findPropertyLogicRuleViolations({
        expandedRules: [EXPANDED_DMS_RULE],
        previousRecord: { products: [] },
        nextRecord: {
          products: ['DMS'],
          usesAggregators: ['TALABAT'],
          uses3pls: 'CERVO_DELIVERY',
        },
        fields: FIELDS,
      }),
    ).toEqual([]);
  });

  it('does not bind later edits while the rule stays true', () => {
    expect(
      findPropertyLogicRuleViolations({
        expandedRules: [EXPANDED_DMS_RULE],
        previousRecord: {
          products: ['DMS'],
          usesAggregators: ['TALABAT'],
          uses3pls: 'CERVO_DELIVERY',
        },
        nextRecord: {
          products: ['DMS'],
          usesAggregators: [],
          uses3pls: 'CERVO_DELIVERY',
        },
        fields: FIELDS,
      }),
    ).toEqual([]);
  });

  it('allows a change that makes the rule false and keeps the hidden values', () => {
    const nextRecord = {
      products: ['SIRA'],
      usesAggregators: ['TALABAT'],
      uses3pls: 'CERVO_DELIVERY',
    };

    expect(
      findPropertyLogicRuleViolations({
        expandedRules: [EXPANDED_DMS_RULE],
        previousRecord: { ...nextRecord, products: ['DMS'] },
        nextRecord,
        fields: FIELDS,
      }),
    ).toEqual([]);
    expect(nextRecord.usesAggregators).toEqual(['TALABAT']);
  });

  it('checks a create as a change from nothing', () => {
    expect(
      findPropertyLogicRuleViolations({
        expandedRules: [EXPANDED_DMS_RULE],
        previousRecord: null,
        nextRecord: { products: ['DMS'] },
        fields: FIELDS,
      }),
    ).toHaveLength(1);
  });

  it('ignores rules whose dependents are all optional', () => {
    expect(
      findPropertyLogicRuleViolations({
        expandedRules: [
          expandPropertyLogicRule(
            {
              ...DMS_RULE,
              properties: [
                {
                  fieldName: toPropertyGroupReference(DMS_GROUP_ID),
                  isRequired: false,
                },
              ],
            },
            FIELD_NAMES_BY_GROUP_ID,
          ),
        ],
        previousRecord: null,
        nextRecord: { products: ['DMS'] },
        fields: FIELDS,
      }),
    ).toEqual([]);
  });

  it('evaluates OR between condition groups and AND inside one', () => {
    const rule = expandPropertyLogicRule(
      {
        ...DMS_RULE,
        conditionGroups: [
          {
            id: 'both',
            conditions: [
              {
                id: 'a',
                fieldName: 'products',
                operator: 'CONTAINS_ANY_OF',
                value: ['SIRA'],
              },
              {
                id: 'b',
                fieldName: 'notes',
                operator: 'IS_KNOWN',
              },
            ],
          },
          {
            id: 'dms',
            conditions: [
              {
                id: 'c',
                fieldName: 'products',
                operator: 'CONTAINS_ANY_OF',
                value: ['DMS'],
              },
            ],
          },
        ],
      },
      FIELD_NAMES_BY_GROUP_ID,
    );
    const check = (nextRecord: Record<string, unknown>) =>
      findPropertyLogicRuleViolations({
        expandedRules: [rule],
        previousRecord: {},
        nextRecord,
        fields: FIELDS,
      }).length;

    expect(check({ products: ['SIRA'] })).toBe(0);
    expect(check({ products: ['SIRA'], notes: 'x' })).toBe(1);
    expect(check({ products: ['DMS'] })).toBe(1);
  });
});

describe('violation message', () => {
  it('names the trigger and the missing fields', () => {
    const nextRecord = { products: ['DMS'] };
    const [violation] = findPropertyLogicRuleViolations({
      expandedRules: [EXPANDED_DMS_RULE],
      previousRecord: null,
      nextRecord,
      fields: FIELDS,
    });

    expect(
      describePropertyLogicTrigger({
        rule: violation.rule,
        record: nextRecord,
        fields: FIELDS,
      }),
    ).toBe('Products -> DMS');
    expect(
      formatPropertyLogicViolationMessage({
        violation,
        record: nextRecord,
        fields: FIELDS,
      }),
    ).toBe('Products -> DMS needs: Uses Aggregators, Uses 3PLs');
  });
});
