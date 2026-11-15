import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { getFilterFilterableFieldMetadataItems } from '@/object-metadata/utils/getFilterFilterableFieldMetadataItems';
import { FieldMetadataType, RelationType } from '~/generated-metadata/graphql';

const isFilterable = getFilterFilterableFieldMetadataItems({
  isJsonFilterEnabled: false,
});

const buildRelationField = ({
  relationType,
  settings,
}: {
  relationType: RelationType;
  settings?: Record<string, unknown>;
}) =>
  ({
    id: 'field-id',
    name: 'dealCollaborators',
    type: FieldMetadataType.RELATION,
    isActive: true,
    isSystem: false,
    relation: { type: relationType },
    settings,
  }) as unknown as FieldMetadataItem;

describe('getFilterFilterableFieldMetadataItems', () => {
  it('offers many-to-one relations', () => {
    expect(
      isFilterable(
        buildRelationField({ relationType: RelationType.MANY_TO_ONE }),
      ),
    ).toBe(true);
  });

  it('offers many-to-many fields such as Deal collaborators', () => {
    expect(
      isFilterable(
        buildRelationField({
          relationType: RelationType.ONE_TO_MANY,
          settings: {
            relationType: RelationType.ONE_TO_MANY,
            junctionTargetFieldId: 'junction-workspace-member-field-id',
          },
        }),
      ),
    ).toBe(true);
  });

  it('keeps plain one-to-many relations out of the filter list', () => {
    expect(
      isFilterable(
        buildRelationField({
          relationType: RelationType.ONE_TO_MANY,
          settings: { relationType: RelationType.ONE_TO_MANY },
        }),
      ),
    ).toBe(false);
  });
});
