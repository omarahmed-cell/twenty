import { type ActivityObjectNameSingular } from '@/activities/types/ActivityObjectNameSingular';
import { useObjectMetadataItem } from '@/object-metadata/hooks/useObjectMetadataItem';
import { isObjectMetadataReadOnly } from '@/object-record/read-only/utils/isObjectMetadataReadOnly';
import { useOpenCreateActivityDrawer } from '@/activities/hooks/useOpenCreateActivityDrawer';
import { type ActivityTargetableObject } from '@/activities/types/ActivityTargetableEntity';
import { useCanUpdateObjectRecords } from '@/object-record/hooks/useCanUpdateObjectRecords';

type UseCreateActivityForTargetRecordParams = {
  targetRecord: ActivityTargetableObject;
  activityObjectNameSingular: ActivityObjectNameSingular;
};

// Attaching to the target needs update permission on its object, not just create on the activity.
export const useCreateActivityForTargetRecord = ({
  targetRecord,
  activityObjectNameSingular,
}: UseCreateActivityForTargetRecordParams) => {
  const { objectMetadataItem } = useObjectMetadataItem({
    objectNameSingular: targetRecord.targetObjectNameSingular,
  });
  const { canUpdateObjectRecords } = useCanUpdateObjectRecords(
    targetRecord.targetObjectNameSingular,
  );

  const openCreateActivityDrawer = useOpenCreateActivityDrawer({
    activityObjectNameSingular,
  });

  const createActivity = () =>
    openCreateActivityDrawer({ targetableObjects: [targetRecord] });

  return {
    canCreateActivity:
      canUpdateObjectRecords &&
      !isObjectMetadataReadOnly({ objectMetadataItem }),
    createActivity,
  };
};
