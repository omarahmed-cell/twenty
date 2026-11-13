import { isUserFieldMetadataItem } from '@/settings/data-model/utils/isUserFieldMetadataItem';
import { type FieldMetadataItemRelation } from '@/object-metadata/types/FieldMetadataItemRelation';
import { FieldMetadataType, RelationType } from '~/generated-metadata/graphql';

const buildRelation = (
  type: RelationType,
  targetNameSingular: string,
): FieldMetadataItemRelation => ({
  type,
  sourceFieldMetadata: { id: 'source-field', name: 'accountOwner' },
  targetFieldMetadata: { id: 'target-field', name: 'accountOwnerForCompanies' },
  sourceObjectMetadata: {
    id: 'company',
    nameSingular: 'company',
    namePlural: 'companies',
  },
  targetObjectMetadata: {
    id: 'target',
    nameSingular: targetNameSingular,
    namePlural: `${targetNameSingular}s`,
  },
});

describe('isUserFieldMetadataItem', () => {
  it('treats a many-to-one relation to workspace members as a User field', () => {
    expect(
      isUserFieldMetadataItem({
        type: FieldMetadataType.RELATION,
        relation: buildRelation(RelationType.MANY_TO_ONE, 'workspaceMember'),
      }),
    ).toBe(true);
  });

  it('ignores the one-to-many side of the relation', () => {
    expect(
      isUserFieldMetadataItem({
        type: FieldMetadataType.RELATION,
        relation: buildRelation(RelationType.ONE_TO_MANY, 'workspaceMember'),
      }),
    ).toBe(false);
  });

  it('ignores relations to other objects', () => {
    expect(
      isUserFieldMetadataItem({
        type: FieldMetadataType.RELATION,
        relation: buildRelation(RelationType.MANY_TO_ONE, 'person'),
      }),
    ).toBe(false);
  });

  it('ignores non-relation fields', () => {
    expect(
      isUserFieldMetadataItem({ type: FieldMetadataType.TEXT, relation: null }),
    ).toBe(false);
  });
});
