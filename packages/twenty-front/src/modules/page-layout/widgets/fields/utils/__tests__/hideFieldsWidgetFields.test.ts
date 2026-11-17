import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { type FieldsWidgetGroupField } from '@/page-layout/widgets/fields/types/FieldsWidgetGroup';
import { hideFieldsWidgetFields } from '@/page-layout/widgets/fields/utils/hideFieldsWidgetFields';

const field = (name: string, globalIndex: number): FieldsWidgetGroupField => ({
  fieldMetadataItem: { id: name, name } as FieldMetadataItem,
  position: globalIndex,
  isVisible: true,
  globalIndex,
});

describe('hideFieldsWidgetFields', () => {
  it('drops hidden fields and empty groups and renumbers the rest', () => {
    const { groups, hiddenFields } = hideFieldsWidgetFields({
      groups: [
        {
          id: 'general',
          name: 'General',
          position: 0,
          isVisible: true,
          fields: [
            field('name', 0),
            field('usesAggregators', 1),
            field('products', 2),
          ],
        },
        {
          id: 'dms',
          name: 'DMS',
          position: 1,
          isVisible: true,
          fields: [field('uses3pls', 3)],
        },
      ],
      hiddenFields: [field('notes', 0), field('usesAggregatorsCopy', 1)],
      hiddenFieldNames: new Set([
        'usesAggregators',
        'uses3pls',
        'usesAggregatorsCopy',
      ]),
    });

    expect(groups.map(({ id }) => id)).toEqual(['general']);
    expect(
      groups[0].fields.map(({ fieldMetadataItem, globalIndex }) => [
        fieldMetadataItem.name,
        globalIndex,
      ]),
    ).toEqual([
      ['name', 0],
      ['products', 1],
    ]);
    expect(
      hiddenFields.map(({ fieldMetadataItem, globalIndex }) => [
        fieldMetadataItem.name,
        globalIndex,
      ]),
    ).toEqual([['notes', 0]]);
  });

  it('returns the configuration untouched when nothing is hidden', () => {
    const groups = [
      {
        id: 'general',
        name: 'General',
        position: 0,
        isVisible: true,
        fields: [field('name', 0)],
      },
    ];

    expect(
      hideFieldsWidgetFields({
        groups,
        hiddenFields: [],
        hiddenFieldNames: new Set(),
      }).groups,
    ).toBe(groups);
  });
});
