import { type FlatIndexMetadata } from 'src/engine/metadata-modules/flat-index-metadata/types/flat-index-metadata.type';
import { type AllStandardObjectIndexName } from 'src/engine/workspace-manager/twenty-standard-application/types/all-standard-object-index-name.type';
import { type CreateStandardIndexArgs } from 'src/engine/workspace-manager/twenty-standard-application/utils/index/create-standard-index-flat-metadata.util';
import { buildStandardTargetFlatIndexMetadatas } from 'src/engine/workspace-manager/twenty-standard-application/utils/index/build-standard-target-flat-index-metadatas.util';

export const buildSegmentMemberStandardFlatIndexMetadatas = (
  args: Omit<CreateStandardIndexArgs<'segmentMember'>, 'context'>,
): Record<AllStandardObjectIndexName<'segmentMember'>, FlatIndexMetadata> => {
  const indexes = buildStandardTargetFlatIndexMetadatas({
    args,
    fieldNames: {
      parent: 'segment',
      person: 'targetPerson',
      company: 'targetCompany',
      opportunity: 'targetOpportunity',
    },
    indexNames: {
      parentIdIndex: 'segmentIdIndex',
      personIdIndex: 'personIdIndex',
      companyIdIndex: 'companyIdIndex',
      opportunityIdIndex: 'opportunityIdIndex',
      personUniqueIndex: 'segmentPersonUniqueIndex',
      companyUniqueIndex: 'segmentCompanyUniqueIndex',
      opportunityUniqueIndex: 'segmentOpportunityUniqueIndex',
    },
  });

  return {
    segmentIdIndex: indexes.parentIdIndex,
    personIdIndex: indexes.personIdIndex,
    companyIdIndex: indexes.companyIdIndex,
    opportunityIdIndex: indexes.opportunityIdIndex,
    segmentPersonUniqueIndex: indexes.personUniqueIndex,
    segmentCompanyUniqueIndex: indexes.companyUniqueIndex,
    segmentOpportunityUniqueIndex: indexes.opportunityUniqueIndex,
  };
};
