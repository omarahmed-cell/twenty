import { useTimelineActivities } from '@/activities/timeline-activities/hooks/useTimelineActivities';
import { useTimelineActivityTypes } from '@/activities/timeline-activities/hooks/useTimelineActivityTypes';
import { getTimelineActivityAction } from '@/activities/timeline-activities/utils/getTimelineActivityAction';
import { useObjectMetadataItems } from '@/object-metadata/hooks/useObjectMetadataItems';
import { mapRoboostTimelineUpdates } from '@/roboost-app/timeline/utils/mapRoboostTimelineUpdates';
import { useLingui } from '@lingui/react/macro';

export const useRoboostTimelineUpdates = ({
  targetRecordId,
  targetObjectNameSingular,
}: {
  targetRecordId: string;
  targetObjectNameSingular: string;
}) => {
  const { t } = useLingui();
  const { objectMetadataItems } = useObjectMetadataItems();
  const { timelineActivities, firstQueryLoading } = useTimelineActivities({
    id: targetRecordId,
    targetObjectNameSingular,
  });
  const { timelineActivityTypeMaps } = useTimelineActivityTypes();
  const objectMetadataItem = objectMetadataItems.find(
    (item) => item.nameSingular === targetObjectNameSingular,
  );

  const items = mapRoboostTimelineUpdates({
    timelineActivities,
    getAction: (timelineActivity) =>
      getTimelineActivityAction(timelineActivity, timelineActivityTypeMaps),
    fields: objectMetadataItem?.fields ?? [],
    objectLabel: objectMetadataItem?.labelSingular ?? '',
    linkedObjectNameById: new Map(
      objectMetadataItems.map((item) => [item.id, item.nameSingular]),
    ),
    labels: {
      created: (objectLabel) => t`${objectLabel} created`,
      changed: (fieldLabels) => t`Updated ${fieldLabels}`,
      deleted: (objectLabel) => t`${objectLabel} deleted`,
      restored: (objectLabel) => t`${objectLabel} restored`,
      linked: (linkedName) => t`Associated with ${linkedName}`,
      unlinked: (linkedName) => t`Association with ${linkedName} removed`,
      updated: t`Record updated`,
      empty: t`Cleared`,
    },
  });

  return { items, loading: firstQueryLoading };
};
