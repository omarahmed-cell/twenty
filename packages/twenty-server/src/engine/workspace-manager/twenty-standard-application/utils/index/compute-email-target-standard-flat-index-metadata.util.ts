import { type FlatIndexMetadata } from 'src/engine/metadata-modules/flat-index-metadata/types/flat-index-metadata.type';
import { type AllStandardObjectIndexName } from 'src/engine/workspace-manager/twenty-standard-application/types/all-standard-object-index-name.type';
import {
  type CreateStandardIndexArgs,
  createStandardIndexFlatMetadata,
} from 'src/engine/workspace-manager/twenty-standard-application/utils/index/create-standard-index-flat-metadata.util';
import { buildStandardTargetFlatIndexMetadatas } from 'src/engine/workspace-manager/twenty-standard-application/utils/index/build-standard-target-flat-index-metadatas.util';

export const buildEmailTargetStandardFlatIndexMetadatas = (
  args: Omit<CreateStandardIndexArgs<'emailTarget'>, 'context'>,
): Record<AllStandardObjectIndexName<'emailTarget'>, FlatIndexMetadata> => {
  const indexes = buildStandardTargetFlatIndexMetadatas({
    args,
    fieldNames: {
      parent: 'email',
      person: 'targetPerson',
      company: 'targetCompany',
      opportunity: 'targetOpportunity',
    },
    indexNames: {
      parentIdIndex: 'emailIdIndex',
      personIdIndex: 'personIdIndex',
      companyIdIndex: 'companyIdIndex',
      opportunityIdIndex: 'opportunityIdIndex',
      personUniqueIndex: 'emailPersonUniqueIndex',
      companyUniqueIndex: 'emailCompanyUniqueIndex',
      opportunityUniqueIndex: 'emailOpportunityUniqueIndex',
    },
  });

  return {
    emailIdIndex: indexes.parentIdIndex,
    personIdIndex: indexes.personIdIndex,
    companyIdIndex: indexes.companyIdIndex,
    opportunityIdIndex: indexes.opportunityIdIndex,
    emailPersonUniqueIndex: indexes.personUniqueIndex,
    emailCompanyUniqueIndex: indexes.companyUniqueIndex,
    emailOpportunityUniqueIndex: indexes.opportunityUniqueIndex,
    serviceIdIndex: createStandardIndexFlatMetadata({
      ...args,
      context: {
        indexName: 'serviceIdIndex',
        relatedFieldNames: ['targetService'],
      },
    }),
    emailServiceUniqueIndex: createStandardIndexFlatMetadata({
      ...args,
      context: {
        indexName: 'emailServiceUniqueIndex',
        relatedFieldNames: ['email', 'targetService'],
        isUnique: true,
        indexWhereClause: '"deletedAt" IS NULL',
      },
    }),
  };
};
