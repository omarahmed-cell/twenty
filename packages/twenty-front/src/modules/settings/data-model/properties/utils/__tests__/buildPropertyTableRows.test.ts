import { FieldMetadataType } from 'twenty-shared/types';

import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { type PropertySettings } from '@/properties/types/PropertySettings';
import {
  ALL_FILTER,
  buildPropertyTableRows,
  filterPropertyTableRows,
  NO_PROPERTY_GROUP_FILTER,
  type PropertyTableRow,
} from '@/settings/data-model/properties/utils/buildPropertyTableRows';

const field = (id: string, label: string) =>
  ({ id, name: id, label, type: FieldMetadataType.TEXT }) as FieldMetadataItem;

const SETTINGS: PropertySettings = {
  groups: [
    {
      id: 'dms',
      name: 'DMS Operational Details',
      objectMetadataId: 'company',
      position: 0,
    },
  ],
  memberships: [
    {
      id: 'm1',
      propertyGroupId: 'dms',
      fieldMetadataId: 'uses3pls',
      objectMetadataId: 'company',
      position: 1,
    },
    {
      id: 'm2',
      propertyGroupId: 'dms',
      fieldMetadataId: 'usesAggregators',
      objectMetadataId: 'company',
      position: 0,
    },
    {
      id: 'gone',
      propertyGroupId: 'deleted-group',
      fieldMetadataId: 'name',
      objectMetadataId: 'company',
      position: 0,
    },
  ],
  rules: [],
  creations: [
    {
      id: 'c1',
      fieldMetadataId: 'uses3pls',
      objectMetadataId: 'company',
      createdAt: '2026-11-17T00:00:00.000Z',
      createdBy: { source: 'API' as never, name: 'API' },
    },
  ] as unknown as PropertySettings['creations'],
};

const ROWS = buildPropertyTableRows({
  fieldMetadataItems: [
    field('name', 'Name'),
    field('uses3pls', 'Uses 3PLs'),
    field('usesAggregators', 'Uses Aggregators'),
  ],
  propertySettings: SETTINGS,
  getTypeLabel: () => 'Text',
});

const labelOf = (row: PropertyTableRow) =>
  row.createdBy?.source === 'API' ? 'API' : 'Unknown';

const filter = (
  overrides: Partial<Parameters<typeof filterPropertyTableRows>[0]>,
) =>
  filterPropertyTableRows({
    rows: ROWS,
    searchTerm: '',
    groupFilter: ALL_FILTER,
    typeFilter: ALL_FILTER,
    createdByFilter: ALL_FILTER,
    getCreatedByLabel: labelOf,
    ...overrides,
  }).map(({ fieldMetadataItem }) => fieldMetadataItem.name);

describe('property table rows', () => {
  it('treats a membership of a deleted group as no group', () => {
    expect(
      ROWS.find((row) => row.fieldMetadataItem.name === 'name')?.groupName,
    ).toBeNull();
  });

  it('filters by group, keeping the group order', () => {
    expect(filter({ groupFilter: 'dms' })).toEqual([
      'usesAggregators',
      'uses3pls',
    ]);
    expect(filter({ groupFilter: NO_PROPERTY_GROUP_FILTER })).toEqual(['name']);
  });

  it('filters by creator and search', () => {
    expect(filter({ createdByFilter: 'API' })).toEqual(['uses3pls']);
    expect(filter({ searchTerm: 'aggreg' })).toEqual(['usesAggregators']);
  });
});
