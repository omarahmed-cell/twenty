import { type TimelineActivity } from '@/activities/timeline-activities/types/TimelineActivity';
import { getTimelineActivityRecordGqlFields } from '@/activities/timeline-activities/utils/getTimelineActivityRecordGqlFields';
import { useObjectMetadataItem } from '@/object-metadata/hooks/useObjectMetadataItem';
import { useObjectMetadataItems } from '@/object-metadata/hooks/useObjectMetadataItems';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { useMemo } from 'react';
import {
  CoreObjectNameSingular,
  type RecordGqlOperationFilter,
} from 'twenty-shared/types';
import { capitalize } from 'twenty-shared/utils';

const FIELD_HISTORY_PAGE_SIZE = 100;

// Each history row holds one field, and jsonb prints "diff" first, so a prefix match finds that field's rows
export const useRoboostFieldHistoryActivities = ({
  recordId,
  objectNameSingular,
  diffKeys,
}: {
  recordId: string;
  objectNameSingular: string;
  diffKeys: string[];
}) => {
  const { objectMetadataItem: timelineActivityMetadata } =
    useObjectMetadataItem({
      objectNameSingular: CoreObjectNameSingular.TimelineActivity,
    });
  const { objectMetadataItems } = useObjectMetadataItems();

  const recordGqlFields = useMemo(
    () =>
      getTimelineActivityRecordGqlFields({
        objectMetadataItems,
        fields: timelineActivityMetadata.fields,
      }),
    [objectMetadataItems, timelineActivityMetadata.fields],
  );

  const filter: RecordGqlOperationFilter = useMemo(
    () => ({
      and: [
        { [`target${capitalize(objectNameSingular)}Id`]: { eq: recordId } },
        { linkedRecordId: { is: 'NULL' } },
        {
          or: diffKeys.map((diffKey) => ({
            properties: { like: `{"diff": {"${diffKey}": %` },
          })),
        },
      ],
    }),
    [diffKeys, objectNameSingular, recordId],
  );

  const { records, loading, fetchMoreRecords, hasNextPage } =
    useFindManyRecords<TimelineActivity>({
      objectNameSingular: CoreObjectNameSingular.TimelineActivity,
      filter,
      orderBy: [{ happensAt: 'DescNullsFirst' }],
      recordGqlFields,
      limit: FIELD_HISTORY_PAGE_SIZE,
      fetchPolicy: 'cache-and-network',
    });

  return {
    timelineActivities: records,
    firstQueryLoading: loading && records.length === 0,
    fetchMoreRecords,
    hasNextPage,
  };
};
