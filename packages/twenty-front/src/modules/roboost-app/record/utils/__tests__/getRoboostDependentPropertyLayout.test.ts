import { getRoboostDependentPropertyLayout } from '@/roboost-app/record/utils/getRoboostDependentPropertyLayout';
import { FieldMetadataType } from 'twenty-shared/types';
import { type ConditionalLogicRule } from 'twenty-shared/utils';

const FIELDS = [
  { name: 'products', label: 'Products', type: FieldMetadataType.MULTI_SELECT },
  {
    name: 'usesAggregators',
    label: 'Uses Aggregators',
    type: FieldMetadataType.MULTI_SELECT,
  },
  { name: 'uses3pls', label: 'Uses 3PLs', type: FieldMetadataType.SELECT },
  {
    name: 'lineOfBusiness',
    label: 'Line of Business',
    type: FieldMetadataType.SELECT,
  },
];

const DMS_RULE: ConditionalLogicRule = {
  id: 'rule-dms',
  conditionGroups: [
    {
      id: 'group',
      conditions: [
        {
          id: 'condition',
          fieldName: 'products',
          operator: 'CONTAINS_ANY_OF',
          value: ['DMS'],
        },
      ],
    },
  ],
  properties: [
    { fieldName: 'usesAggregators', isRequired: true },
    { fieldName: 'uses3pls', isRequired: true },
  ],
};

describe('getRoboostDependentPropertyLayout', () => {
  it('puts the dependents under their trigger while the rule is true', () => {
    const layout = getRoboostDependentPropertyLayout({
      fieldNames: ['products', 'lineOfBusiness'],
      rules: [DMS_RULE],
      record: { products: ['DMS'] },
      fields: FIELDS,
    });

    expect(layout.fieldNames).toEqual(['products', 'lineOfBusiness']);
    expect(layout.dependentsByTriggerFieldName.get('products')).toEqual([
      { fieldName: 'usesAggregators', isRequired: true },
      { fieldName: 'uses3pls', isRequired: true },
    ]);
  });

  it('moves dependents the card lists out of their usual place', () => {
    const layout = getRoboostDependentPropertyLayout({
      fieldNames: ['uses3pls', 'products', 'lineOfBusiness'],
      rules: [DMS_RULE],
      record: { products: ['LMS'] },
      fields: FIELDS,
    });

    expect(layout.fieldNames).toEqual(['products', 'lineOfBusiness']);
    expect(layout.dependentsByTriggerFieldName.size).toBe(0);
  });

  it('leaves the list alone when the trigger is not in it', () => {
    const layout = getRoboostDependentPropertyLayout({
      fieldNames: ['uses3pls', 'lineOfBusiness'],
      rules: [DMS_RULE],
      record: { products: ['DMS'] },
      fields: FIELDS,
    });

    expect(layout.fieldNames).toEqual(['uses3pls', 'lineOfBusiness']);
    expect(layout.dependentsByTriggerFieldName.size).toBe(0);
  });
});
