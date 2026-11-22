import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { getRoboostAssociations } from '@/roboost-app/record/utils/getRoboostAssociations';
import { RelationType } from '~/generated-metadata/graphql';

const makeObject = (
  nameSingular: string,
  fields: Record<string, unknown>[] = [],
  isSystem = false,
) =>
  ({
    id: nameSingular,
    nameSingular,
    namePlural: `${nameSingular}s`,
    labelSingular: nameSingular,
    labelPlural: `${nameSingular}s`,
    isActive: true,
    isSystem,
    fields,
  }) as unknown as EnrichedObjectMetadataItem;

const relationField = (
  name: string,
  type: RelationType,
  targetNameSingular: string,
  targetFieldName: string,
) => ({
  id: name,
  name,
  label: name,
  isActive: true,
  relation: {
    type,
    targetObjectMetadata: { nameSingular: targetNameSingular },
    targetFieldMetadata: { name: targetFieldName },
  },
});

describe('getRoboostAssociations', () => {
  const company = makeObject('company', [
    relationField('people', RelationType.ONE_TO_MANY, 'person', 'company'),
    relationField(
      'attachments',
      RelationType.ONE_TO_MANY,
      'attachment',
      'targetCompany',
    ),
    relationField(
      'noteTargets',
      RelationType.ONE_TO_MANY,
      'noteTarget',
      'targetCompany',
    ),
    relationField(
      'accountOwner',
      RelationType.MANY_TO_ONE,
      'workspaceMember',
      'accountOwnerForCompanies',
    ),
    relationField(
      'parentCompany',
      RelationType.MANY_TO_ONE,
      'company',
      'childCompanies',
    ),
  ]);
  const objects = [
    company,
    makeObject('person'),
    makeObject('noteTarget', [], true),
    makeObject('workspaceMember'),
    makeObject('attachment', [], true),
  ];

  it('lists business relations, skips system objects and members, and adds attachments', () => {
    const associations = getRoboostAssociations(
      company,
      objects,
      'Attachments',
    );

    expect(associations.map((association) => association.id)).toEqual([
      'people',
      'parentCompany',
      'attachments',
    ]);
    expect(associations[0]).toMatchObject({
      kind: 'many',
      joinColumnName: 'companyId',
    });
    expect(associations[2]).toMatchObject({
      kind: 'attachments',
      joinColumnName: 'targetCompanyId',
    });
  });
});
