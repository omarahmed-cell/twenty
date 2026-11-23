import { type FlatIndexMetadata } from 'src/engine/metadata-modules/flat-index-metadata/types/flat-index-metadata.type';
import { type AllStandardObjectIndexName } from 'src/engine/workspace-manager/twenty-standard-application/types/all-standard-object-index-name.type';
import {
  type CreateStandardIndexArgs,
  createStandardIndexFlatMetadata,
} from 'src/engine/workspace-manager/twenty-standard-application/utils/index/create-standard-index-flat-metadata.util';
import { buildStandardTargetFlatIndexMetadatas } from 'src/engine/workspace-manager/twenty-standard-application/utils/index/build-standard-target-flat-index-metadatas.util';

export const buildMeetingTargetStandardFlatIndexMetadatas = (
  args: Omit<CreateStandardIndexArgs<'meetingTarget'>, 'context'>,
): Record<AllStandardObjectIndexName<'meetingTarget'>, FlatIndexMetadata> => {
  const indexes = buildStandardTargetFlatIndexMetadatas({
    args,
    fieldNames: {
      parent: 'meeting',
      person: 'targetPerson',
      company: 'targetCompany',
      opportunity: 'targetOpportunity',
    },
    indexNames: {
      parentIdIndex: 'meetingIdIndex',
      personIdIndex: 'personIdIndex',
      companyIdIndex: 'companyIdIndex',
      opportunityIdIndex: 'opportunityIdIndex',
      personUniqueIndex: 'meetingPersonUniqueIndex',
      companyUniqueIndex: 'meetingCompanyUniqueIndex',
      opportunityUniqueIndex: 'meetingOpportunityUniqueIndex',
    },
  });

  return {
    meetingIdIndex: indexes.parentIdIndex,
    personIdIndex: indexes.personIdIndex,
    companyIdIndex: indexes.companyIdIndex,
    opportunityIdIndex: indexes.opportunityIdIndex,
    meetingPersonUniqueIndex: indexes.personUniqueIndex,
    meetingCompanyUniqueIndex: indexes.companyUniqueIndex,
    meetingOpportunityUniqueIndex: indexes.opportunityUniqueIndex,
    serviceIdIndex: createStandardIndexFlatMetadata({
      ...args,
      context: {
        indexName: 'serviceIdIndex',
        relatedFieldNames: ['targetService'],
      },
    }),
    meetingServiceUniqueIndex: createStandardIndexFlatMetadata({
      ...args,
      context: {
        indexName: 'meetingServiceUniqueIndex',
        relatedFieldNames: ['meeting', 'targetService'],
        isUnique: true,
        indexWhereClause: '"deletedAt" IS NULL',
      },
    }),
  };
};
