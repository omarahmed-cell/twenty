import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { buildRoboostCloneValues } from '@/roboost-app/record/utils/buildRoboostCloneValues';
import { FieldMetadataType, RelationType } from '~/generated-metadata/graphql';

const company = {
  id: 'company',
  nameSingular: 'company',
  labelIdentifierFieldMetadataId: 'name',
  isActive: true,
  fields: [
    { id: 'name', name: 'name', type: FieldMetadataType.TEXT, isActive: true },
    {
      id: 'domainName',
      name: 'domainName',
      type: FieldMetadataType.LINKS,
      isActive: true,
    },
    {
      id: 'parentCompany',
      name: 'parentCompany',
      type: FieldMetadataType.RELATION,
      isActive: true,
      relation: {
        type: RelationType.MANY_TO_ONE,
        targetObjectMetadata: { nameSingular: 'company' },
      },
    },
    {
      id: 'createdAt',
      name: 'createdAt',
      type: FieldMetadataType.DATE_TIME,
      isActive: true,
    },
  ],
} as unknown as EnrichedObjectMetadataItem;

describe('buildRoboostCloneValues', () => {
  it('copies editable values, marks the name as a copy and keeps relations as ids with labels', () => {
    const { initialValues, initialRelatedRecords } = buildRoboostCloneValues(
      company,
      {
        id: '1',
        name: 'Airbnb',
        domainName: { __typename: 'Links', primaryLinkUrl: 'airbnb.com' },
        parentCompany: { id: 'p1', name: 'Holding' },
        createdAt: '2026-01-01',
      },
      [company],
      '(copy)',
    );

    expect(initialValues).toEqual({
      name: 'Airbnb (copy)',
      domainName: { primaryLinkUrl: 'airbnb.com' },
      parentCompany: 'p1',
    });
    expect(initialRelatedRecords).toEqual({
      parentCompany: { id: 'p1', label: 'Holding' },
    });
  });
});
