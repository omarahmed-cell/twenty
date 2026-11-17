import { FieldMetadataType, RelationType } from 'twenty-shared/types';

import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { buildConditionalLogicFields } from '@/conditional-logic/utils/buildConditionalLogicFields';

const field = (overrides: Partial<FieldMetadataItem>) =>
  ({
    id: overrides.name,
    label: overrides.name,
    isActive: true,
    isSystem: false,
    ...overrides,
  }) as FieldMetadataItem;

describe('buildConditionalLogicFields', () => {
  it('keeps plain fields and many-to-one relations with their foreign key', () => {
    expect(
      buildConditionalLogicFields([
        field({ name: 'dealType', type: FieldMetadataType.SELECT }),
        field({
          name: 'owner',
          type: FieldMetadataType.RELATION,
          settings: { relationType: RelationType.MANY_TO_ONE },
        }),
        field({
          name: 'tasks',
          type: FieldMetadataType.RELATION,
          settings: { relationType: RelationType.ONE_TO_MANY },
        }),
        field({
          name: 'position',
          type: FieldMetadataType.POSITION,
          isSystem: true,
        }),
      ]),
    ).toEqual([
      { name: 'dealType', label: 'dealType', type: FieldMetadataType.SELECT },
      {
        name: 'owner',
        label: 'owner',
        type: FieldMetadataType.RELATION,
        joinColumnName: 'ownerId',
      },
    ]);
  });
});
