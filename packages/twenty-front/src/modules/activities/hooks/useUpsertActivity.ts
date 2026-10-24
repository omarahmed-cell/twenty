import { type NoteLikeActivity } from '@/activities/types/NoteLikeActivity';
import { type ActivityObjectNameSingular } from '@/activities/types/ActivityObjectNameSingular';
import { useCreateActivityInDB } from '@/activities/hooks/useCreateActivityInDB';
import { useRefreshShowPageFindManyActivitiesQueries } from '@/activities/hooks/useRefreshShowPageFindManyActivitiesQueries';
import { isActivityInCreateModeState } from '@/activities/states/isActivityInCreateModeState';
import { isUpsertingActivityInDBState } from '@/activities/states/isCreatingActivityInDBState';
import { objectShowPageTargetableObjectState } from '@/activities/timeline-activities/states/objectShowPageTargetableObjectState';
import { type Task } from '@/activities/types/Task';
import { useUpdateOneRecord } from '@/object-record/hooks/useUpdateOneRecord';
import { isDefined } from 'twenty-shared/utils';
import { useAtomState } from '@/ui/utilities/state/jotai/hooks/useAtomState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';

export const useUpsertActivity = ({
  activityObjectNameSingular,
}: {
  activityObjectNameSingular: ActivityObjectNameSingular;
}) => {
  const [isActivityInCreateMode] = useAtomState(isActivityInCreateModeState);

  const { updateOneRecord: updateOneActivity } = useUpdateOneRecord();

  const { createActivityInDB } = useCreateActivityInDB({
    activityObjectNameSingular,
  });

  const [, setIsUpsertingActivityInDB] = useAtomState(
    isUpsertingActivityInDBState,
  );

  const objectShowPageTargetableObject = useAtomStateValue(
    objectShowPageTargetableObjectState,
  );

  const { refreshShowPageFindManyActivitiesQueries } =
    useRefreshShowPageFindManyActivitiesQueries({
      activityObjectNameSingular,
    });

  const upsertActivity = async ({
    activity,
    input,
  }: {
    activity: Task | NoteLikeActivity;
    input: Partial<Task | NoteLikeActivity>;
  }) => {
    setIsUpsertingActivityInDB(true);
    if (isActivityInCreateMode) {
      const activityToCreate: Partial<Task | NoteLikeActivity> = {
        ...activity,
        ...input,
      };

      if (isDefined(objectShowPageTargetableObject)) {
        refreshShowPageFindManyActivitiesQueries();
      }

      await createActivityInDB(activityToCreate);
    } else {
      await updateOneActivity?.({
        objectNameSingular: activityObjectNameSingular,
        idToUpdate: activity.id,
        updateOneRecordInput: input,
      });
    }

    setIsUpsertingActivityInDB(false);
  };

  return {
    upsertActivity,
  };
};
