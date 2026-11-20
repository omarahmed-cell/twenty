import { useApolloCoreClient } from '@/object-metadata/hooks/useApolloCoreClient';
import { useObjectMetadataItem } from '@/object-metadata/hooks/useObjectMetadataItem';
import { getRecordsFromRecordConnection } from '@/object-record/cache/utils/getRecordsFromRecordConnection';
import { type RecordGqlOperationFindManyResult } from '@/object-record/graphql/types/RecordGqlOperationFindManyResult';
import { useFindManyRecordsQuery } from '@/object-record/hooks/useFindManyRecordsQuery';
import { useObjectPermissionsForObject } from '@/object-record/hooks/useObjectPermissionsForObject';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { useQuery } from '@apollo/client/react';
import {
  type RecordGqlFields,
  type RecordGqlOperationFilter,
  type RecordGqlOperationOrderBy,
} from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

type UseRoboostPagedRecordsParams = {
  objectNameSingular: string;
  filter?: RecordGqlOperationFilter;
  orderBy?: RecordGqlOperationOrderBy;
  recordGqlFields: RecordGqlFields;
  page: number;
  pageSize: number;
  skip?: boolean;
};

// Page-based reads (limit + offset + totalCount) for screens with a numbered pager
export const useRoboostPagedRecords = <TRecord extends ObjectRecord>({
  objectNameSingular,
  filter,
  orderBy,
  recordGqlFields,
  page,
  pageSize,
  skip = false,
}: UseRoboostPagedRecordsParams) => {
  const apolloCoreClient = useApolloCoreClient();
  const { objectMetadataItem } = useObjectMetadataItem({ objectNameSingular });
  const { findManyRecordsQuery } = useFindManyRecordsQuery({
    objectNameSingular,
    recordGqlFields,
  });
  const { canReadObjectRecords } = useObjectPermissionsForObject(
    objectMetadataItem.id,
  );

  const { data, previousData, loading, error, refetch } =
    useQuery<RecordGqlOperationFindManyResult>(findManyRecordsQuery, {
      client: apolloCoreClient,
      skip: skip || !canReadObjectRecords,
      variables: {
        filter,
        orderBy,
        limit: pageSize,
        offset: (page - 1) * pageSize,
      },
      fetchPolicy: 'cache-and-network',
    });

  // Keep the previous page on screen while the next one loads
  const connection = (data ?? previousData)?.[objectMetadataItem.namePlural];

  const records = isDefined(connection)
    ? getRecordsFromRecordConnection<TRecord>({ recordConnection: connection })
    : [];

  return {
    records,
    totalCount: connection?.totalCount ?? 0,
    loading,
    error,
    refetch,
    hasLoaded: isDefined(connection),
  };
};
