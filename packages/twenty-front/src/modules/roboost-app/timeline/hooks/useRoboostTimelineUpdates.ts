import { useTimelineActivities } from '@/activities/timeline-activities/hooks/useTimelineActivities';
import { useTimelineActivityTypes } from '@/activities/timeline-activities/hooks/useTimelineActivityTypes';
import { getTimelineActivityAction } from '@/activities/timeline-activities/utils/getTimelineActivityAction';
import { useObjectMetadataItems } from '@/object-metadata/hooks/useObjectMetadataItems';
import { ROBOOST_RECORD_IMPORT_SOURCE } from '@/roboost-app/data-transfer/graphql/roboostDataTransferQueries';
import {
  getRoboostCreatedTitle,
  type RoboostRecordImportSource,
} from '@/roboost-app/timeline/utils/getRoboostCreatedTitle';
import { mapRoboostTimelineUpdates } from '@/roboost-app/timeline/utils/mapRoboostTimelineUpdates';
import { useQuery } from '@apollo/client/react';
import { useLingui } from '@lingui/react/macro';

export const useRoboostTimelineUpdates = ({
  targetRecordId,
  targetObjectNameSingular,
}: {
  targetRecordId: string;
  targetObjectNameSingular: string;
}) => {
  const { t, i18n } = useLingui();
  const { objectMetadataItems } = useObjectMetadataItems();
  const { timelineActivities, firstQueryLoading } = useTimelineActivities({
    id: targetRecordId,
    targetObjectNameSingular,
  });
  const { timelineActivityTypeMaps } = useTimelineActivityTypes();
  const { data: importSourceData } = useQuery<{
    roboostRecordImportSource: RoboostRecordImportSource;
  }>(ROBOOST_RECORD_IMPORT_SOURCE, {
    variables: {
      objectNameSingular: targetObjectNameSingular,
      recordId: targetRecordId,
    },
  });
  const objectLabel =
    objectMetadataItems.find(
      (item) => item.nameSingular === targetObjectNameSingular,
    )?.labelSingular ?? '';

  const items = mapRoboostTimelineUpdates({
    timelineActivities,
    getAction: (timelineActivity) =>
      getTimelineActivityAction(timelineActivity, timelineActivityTypeMaps),
    createdTitle: getRoboostCreatedTitle({
      objectLabel,
      importSource: importSourceData?.roboostRecordImportSource,
      i18n,
    }),
    getMergeTitle: (event, otherRecordName) =>
      event === 'merged'
        ? t`merged ${otherRecordName} into this record`
        : event === 'unmerged'
          ? t`unmerged ${otherRecordName} from this record`
          : t`restored this record from ${otherRecordName} by unmerging`,
  });

  return { items, loading: firstQueryLoading };
};
