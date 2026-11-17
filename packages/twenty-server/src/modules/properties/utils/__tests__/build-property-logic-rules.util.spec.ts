import { toPropertyGroupReference } from 'twenty-shared/utils';

import { buildPropertyLogicRulesByObjectMetadataId } from 'src/modules/properties/utils/build-property-logic-rules.util';

describe('buildPropertyLogicRulesByObjectMetadataId', () => {
  it('groups rules by object and expands groups in member order', () => {
    const rulesByObject = buildPropertyLogicRulesByObjectMetadataId({
      rules: [
        {
          id: 'dms-rule',
          objectMetadataId: 'company',
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
            { fieldName: toPropertyGroupReference('dms'), isRequired: true },
          ],
        },
        {
          id: 'broken',
          objectMetadataId: 'company',
          conditionGroups: 'not json rules',
          properties: null,
        },
      ],
      memberships: [
        { propertyGroupId: 'dms', fieldMetadataId: 'uses3pls-id', position: 2 },
        {
          propertyGroupId: 'dms',
          fieldMetadataId: 'aggregators-id',
          position: 1,
        },
        { propertyGroupId: 'dms', fieldMetadataId: 'deleted-id', position: 3 },
      ],
      fieldNameById: new Map([
        ['aggregators-id', 'usesAggregators'],
        ['uses3pls-id', 'uses3pls'],
      ]),
    });

    expect(rulesByObject.get('company')?.map(({ id }) => id)).toEqual([
      'dms-rule',
      'broken',
    ]);
    expect(rulesByObject.get('company')?.[0].properties).toEqual([
      { fieldName: 'usesAggregators', isRequired: true },
      { fieldName: 'uses3pls', isRequired: true },
    ]);
    expect(rulesByObject.get('company')?.[1].properties).toEqual([]);
  });
});
