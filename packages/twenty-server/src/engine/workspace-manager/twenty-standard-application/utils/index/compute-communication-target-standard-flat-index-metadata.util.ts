import { type FlatIndexMetadata } from 'src/engine/metadata-modules/flat-index-metadata/types/flat-index-metadata.type';
import { type AllStandardObjectIndexName } from 'src/engine/workspace-manager/twenty-standard-application/types/all-standard-object-index-name.type';
import {
  type CreateStandardIndexArgs,
  createStandardIndexFlatMetadata,
} from 'src/engine/workspace-manager/twenty-standard-application/utils/index/create-standard-index-flat-metadata.util';
import { buildStandardTargetFlatIndexMetadatas } from 'src/engine/workspace-manager/twenty-standard-application/utils/index/build-standard-target-flat-index-metadatas.util';

export const buildCommunicationTargetStandardFlatIndexMetadatas = (
  args: Omit<CreateStandardIndexArgs<'communicationTarget'>, 'context'>,
): Record<
  AllStandardObjectIndexName<'communicationTarget'>,
  FlatIndexMetadata
> => {
  const indexes = buildStandardTargetFlatIndexMetadatas({
    args,
    fieldNames: {
      parent: 'communication',
      person: 'targetPerson',
      company: 'targetCompany',
      opportunity: 'targetOpportunity',
    },
    indexNames: {
      parentIdIndex: 'communicationIdIndex',
      personIdIndex: 'personIdIndex',
      companyIdIndex: 'companyIdIndex',
      opportunityIdIndex: 'opportunityIdIndex',
      personUniqueIndex: 'communicationPersonUniqueIndex',
      companyUniqueIndex: 'communicationCompanyUniqueIndex',
      opportunityUniqueIndex: 'communicationOpportunityUniqueIndex',
    },
  });

  return {
    communicationIdIndex: indexes.parentIdIndex,
    personIdIndex: indexes.personIdIndex,
    companyIdIndex: indexes.companyIdIndex,
    opportunityIdIndex: indexes.opportunityIdIndex,
    communicationPersonUniqueIndex: indexes.personUniqueIndex,
    communicationCompanyUniqueIndex: indexes.companyUniqueIndex,
    communicationOpportunityUniqueIndex: indexes.opportunityUniqueIndex,
    serviceIdIndex: createStandardIndexFlatMetadata({
      ...args,
      context: {
        indexName: 'serviceIdIndex',
        relatedFieldNames: ['targetService'],
      },
    }),
    communicationServiceUniqueIndex: createStandardIndexFlatMetadata({
      ...args,
      context: {
        indexName: 'communicationServiceUniqueIndex',
        relatedFieldNames: ['communication', 'targetService'],
        isUnique: true,
        indexWhereClause: '"deletedAt" IS NULL',
      },
    }),
  };
};
