import { toPropertyGroupReference } from 'twenty-shared/utils';

import { type PropertySettings } from '@/properties/types/PropertySettings';
import { buildObjectPropertyLogicRules } from '@/properties/utils/buildObjectPropertyLogicRules';

const SETTINGS: PropertySettings = {
  groups: [
    { id: 'dms', name: 'DMS', objectMetadataId: 'company', position: 0 },
  ],
  memberships: [
    {
      id: 'b',
      propertyGroupId: 'dms',
      fieldMetadataId: 'f-3pls',
      objectMetadataId: 'company',
      position: 1,
    },
    {
      id: 'a',
      propertyGroupId: 'dms',
      fieldMetadataId: 'f-aggregators',
      objectMetadataId: 'company',
      position: 0,
    },
  ],
  rules: [
    {
      id: 'rule',
      objectMetadataId: 'company',
      conditionGroups: [],
      properties: [
        { fieldName: toPropertyGroupReference('dms'), isRequired: true },
      ],
      position: 0,
      createdAt: '2026-11-17T00:00:00.000Z',
      createdBy: null,
    },
    {
      id: 'other-object',
      objectMetadataId: 'person',
      conditionGroups: [],
      properties: [],
      position: 1,
      createdAt: '2026-11-17T00:00:00.000Z',
      createdBy: null,
    },
  ],
  creations: [],
};

describe('buildObjectPropertyLogicRules', () => {
  it('keeps the object rules and expands groups in member order', () => {
    const rules = buildObjectPropertyLogicRules({
      propertySettings: SETTINGS,
      objectMetadataId: 'company',
      fields: [
        { id: 'f-aggregators', name: 'usesAggregators' },
        { id: 'f-3pls', name: 'uses3pls' },
      ],
    });

    expect(rules.map(({ id }) => id)).toEqual(['rule']);
    expect(rules[0].properties).toEqual([
      { fieldName: 'usesAggregators', isRequired: true },
      { fieldName: 'uses3pls', isRequired: true },
    ]);
  });

  it('has no rules before the settings load', () => {
    expect(
      buildObjectPropertyLogicRules({
        propertySettings: null,
        objectMetadataId: 'company',
        fields: [],
      }),
    ).toEqual([]);
  });
});
