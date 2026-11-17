import { FieldMetadataType } from 'twenty-shared/types';
import {
  type ConditionalLogicField,
  type ConditionalLogicRule,
  toPropertyGroupReference,
} from 'twenty-shared/utils';

import {
  describePropertyLogicConditions,
  describePropertyLogicDependents,
} from '@/settings/data-model/properties/utils/describePropertyLogicRule';

const FIELDS: ConditionalLogicField[] = [
  {
    name: 'products',
    label: 'Products',
    type: FieldMetadataType.MULTI_SELECT,
    options: [{ value: 'DMS', label: 'DMS' }],
  },
  { name: 'notes', label: 'Notes', type: FieldMetadataType.TEXT },
];

const RULE: ConditionalLogicRule = {
  id: 'rule',
  conditionGroups: [
    {
      id: 'first',
      conditions: [
        {
          id: 'a',
          fieldName: 'products',
          operator: 'CONTAINS_ANY_OF',
          value: ['DMS'],
        },
        { id: 'b', fieldName: 'notes', operator: 'IS_KNOWN' },
      ],
    },
    { id: 'empty', conditions: [] },
  ],
  properties: [
    { fieldName: toPropertyGroupReference('dms'), isRequired: true },
    { fieldName: 'notes', isRequired: false },
  ],
};

describe('describePropertyLogicRule', () => {
  it('words the conditions with option labels', () => {
    expect(
      describePropertyLogicConditions({ rule: RULE, fields: FIELDS }),
    ).toBe('Products contains any of "DMS" AND Notes is known');
  });

  it('lists dependents with group names and marks required ones', () => {
    expect(
      describePropertyLogicDependents({
        rule: RULE,
        fields: FIELDS,
        groupNameById: new Map([['dms', 'DMS Operational Details']]),
      }),
    ).toEqual(['Group: DMS Operational Details *', 'Notes']);
  });
});
