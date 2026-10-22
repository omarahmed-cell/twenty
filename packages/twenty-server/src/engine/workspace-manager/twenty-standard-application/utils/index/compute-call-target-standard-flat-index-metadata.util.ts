import { type FlatIndexMetadata } from 'src/engine/metadata-modules/flat-index-metadata/types/flat-index-metadata.type';
import { type AllStandardObjectIndexName } from 'src/engine/workspace-manager/twenty-standard-application/types/all-standard-object-index-name.type';
import {
  type CreateStandardIndexArgs,
  createStandardIndexFlatMetadata,
} from 'src/engine/workspace-manager/twenty-standard-application/utils/index/create-standard-index-flat-metadata.util';
import { buildStandardTargetFlatIndexMetadatas } from 'src/engine/workspace-manager/twenty-standard-application/utils/index/build-standard-target-flat-index-metadatas.util';

export const buildCallTargetStandardFlatIndexMetadatas = (
  args: Omit<CreateStandardIndexArgs<'callTarget'>, 'context'>,
): Record<AllStandardObjectIndexName<'callTarget'>, FlatIndexMetadata> => {
  const indexes = buildStandardTargetFlatIndexMetadatas({
    args,
    fieldNames: {
      parent: 'call',
      person: 'targetPerson',
      company: 'targetCompany',
      opportunity: 'targetOpportunity',
    },
    indexNames: {
      parentIdIndex: 'callIdIndex',
      personIdIndex: 'personIdIndex',
      companyIdIndex: 'companyIdIndex',
      opportunityIdIndex: 'opportunityIdIndex',
      personUniqueIndex: 'callPersonUniqueIndex',
      companyUniqueIndex: 'callCompanyUniqueIndex',
      opportunityUniqueIndex: 'callOpportunityUniqueIndex',
    },
  });

  return {
    callIdIndex: indexes.parentIdIndex,
    personIdIndex: indexes.personIdIndex,
    companyIdIndex: indexes.companyIdIndex,
    opportunityIdIndex: indexes.opportunityIdIndex,
    callPersonUniqueIndex: indexes.personUniqueIndex,
    callCompanyUniqueIndex: indexes.companyUniqueIndex,
    callOpportunityUniqueIndex: indexes.opportunityUniqueIndex,
    serviceIdIndex: createStandardIndexFlatMetadata({
      ...args,
      context: {
        indexName: 'serviceIdIndex',
        relatedFieldNames: ['targetService'],
      },
    }),
    callServiceUniqueIndex: createStandardIndexFlatMetadata({
      ...args,
      context: {
        indexName: 'callServiceUniqueIndex',
        relatedFieldNames: ['call', 'targetService'],
        isUnique: true,
        indexWhereClause: '"deletedAt" IS NULL',
      },
    }),
  };
};
