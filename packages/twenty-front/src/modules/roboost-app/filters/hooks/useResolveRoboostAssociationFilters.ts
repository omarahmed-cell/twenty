import { ROBOOST_IMPORT_FILTER_FIELD_NAME } from '@/roboost-app/data-transfer/constants/RoboostImportFilterFieldName';
import { ROBOOST_IMPORT_RECORD_IDS } from '@/roboost-app/data-transfer/graphql/roboostDataTransferQueries';
import { useApolloClient } from '@apollo/client/react';
import { useApolloCoreClient } from '@/object-metadata/hooks/useApolloCoreClient';
import { useObjectMetadataItems } from '@/object-metadata/hooks/useObjectMetadataItems';
import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { useObjectPermissions } from '@/object-record/hooks/useObjectPermissions';
import { type RecordGqlOperationFindManyResult } from '@/object-record/graphql/types/RecordGqlOperationFindManyResult';
import { generateFindManyRecordsQuery } from '@/object-record/utils/generateFindManyRecordsQuery';
import { getRecordsFromRecordConnection } from '@/object-record/cache/utils/getRecordsFromRecordConnection';
import { buildRoboostFilterRule } from '@/roboost-app/filters/utils/buildRoboostFilterRule';
import { type RoboostAssociationFilter } from '@/roboost-app/list/types/RoboostListFilters';
import { type RecordGqlOperationFilter } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import { RelationType } from '~/generated-metadata/graphql';

const RESOLVE_LIMIT = 1000;
// An empty id list would be ignored by the API, so a nil id makes "no match" explicit
const NO_MATCH_ID = '00000000-0000-0000-0000-000000000000';

// Related-object conditions run as a query on that object; its matches become an id filter on the list
export const useResolveRoboostAssociationFilters = (
  objectMetadataItem: EnrichedObjectMetadataItem,
) => {
  const apolloCoreClient = useApolloCoreClient();
  const apolloClient = useApolloClient();
  const { objectMetadataItems } = useObjectMetadataItems();
  const { objectPermissionsByObjectMetadataId } = useObjectPermissions();

  const resolveImport = async (
    association: RoboostAssociationFilter,
  ): Promise<RecordGqlOperationFilter | null> => {
    const rule = association.rules[0];
    const importIds = Array.isArray(rule?.value) ? rule.value : [];

    if (importIds.length === 0) {
      return null;
    }
    const { data } = await apolloClient.query<{
      roboostImportRecordIds: string[];
    }>({
      query: ROBOOST_IMPORT_RECORD_IDS,
      variables: {
        importIds,
        objectNameSingular: objectMetadataItem.nameSingular,
      },
      fetchPolicy: 'network-only',
    });
    const recordIds = data?.roboostImportRecordIds ?? [];

    if (rule.operator === 'isNoneOf') {
      return recordIds.length > 0 ? { not: { id: { in: recordIds } } } : null;
    }

    return { id: { in: recordIds.length > 0 ? recordIds : [NO_MATCH_ID] } };
  };

  const resolveOne = async (
    association: RoboostAssociationFilter,
  ): Promise<RecordGqlOperationFilter | null> => {
    if (association.relationFieldName === ROBOOST_IMPORT_FILTER_FIELD_NAME) {
      return resolveImport(association);
    }
    const relationField = objectMetadataItem.fields.find(
      (field) => field.name === association.relationFieldName,
    );
    const targetObjectMetadataItem = objectMetadataItems.find(
      (item) =>
        item.nameSingular ===
        relationField?.relation?.targetObjectMetadata.nameSingular,
    );

    if (
      !isDefined(relationField?.relation) ||
      !isDefined(targetObjectMetadataItem)
    ) {
      return null;
    }
    const conditions = association.rules
      .map((rule) => {
        const field = targetObjectMetadataItem.fields.find(
          (candidate) => candidate.name === rule.fieldName,
        );

        return isDefined(field)
          ? buildRoboostFilterRule({
              field,
              operator: rule.operator,
              value: rule.value,
              selectOptionValues: (field.options ?? []).map(
                (option) => option.value,
              ),
            })
          : undefined;
      })
      .filter(isDefined);

    if (conditions.length === 0) {
      return null;
    }
    const isManyToOne =
      relationField.relation.type === RelationType.MANY_TO_ONE;
    const inverseFieldName = relationField.relation.targetFieldMetadata.name;
    const { data } =
      await apolloCoreClient.query<RecordGqlOperationFindManyResult>({
        query: generateFindManyRecordsQuery({
          objectMetadataItem: targetObjectMetadataItem,
          objectMetadataItems,
          recordGqlFields: isManyToOne
            ? { id: true }
            : { id: true, [`${inverseFieldName}Id`]: true },
          objectPermissionsByObjectMetadataId,
        }),
        variables: {
          filter: conditions.length === 1 ? conditions[0] : { and: conditions },
          limit: RESOLVE_LIMIT,
        },
        fetchPolicy: 'network-only',
      });
    const connection = data?.[targetObjectMetadataItem.namePlural];
    const records = isDefined(connection)
      ? getRecordsFromRecordConnection({ recordConnection: connection })
      : [];
    const ids = isManyToOne
      ? records.map((record) => record.id)
      : records
          .map((record) => record[`${inverseFieldName}Id`])
          .filter((id): id is string => typeof id === 'string');
    const uniqueIds = ids.length > 0 ? [...new Set(ids)] : [NO_MATCH_ID];

    return isManyToOne
      ? { [`${relationField.name}Id`]: { in: uniqueIds } }
      : { id: { in: uniqueIds } };
  };

  const resolveAssociationFilters = (
    associations: RoboostAssociationFilter[],
  ) =>
    Promise.all(
      associations.map(async (association) => ({
        ...association,
        resolvedFilter: await resolveOne(association),
      })),
    );

  return { resolveAssociationFilters };
};
