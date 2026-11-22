import { currentWorkspaceMemberState } from '@/auth/states/currentWorkspaceMemberState';
import { useApolloCoreClient } from '@/object-metadata/hooks/useApolloCoreClient';
import { useObjectMetadataItems } from '@/object-metadata/hooks/useObjectMetadataItems';
import { useCreateOneRecord } from '@/object-record/hooks/useCreateOneRecord';
import {
  type RoboostActivityTarget,
  type RoboostActivityType,
} from '@/roboost-app/activity/states/roboostActivityComposerState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { capitalize, isDefined } from 'twenty-shared/utils';

export const ROBOOST_ACTIVITY_OBJECT_BY_TYPE: Record<
  RoboostActivityType,
  string
> = {
  note: 'note',
  call: 'call',
  task: 'task',
  meeting: 'calendarEvent',
  whatsapp: 'communication',
  linkedin: 'communication',
  sms: 'communication',
};

// A missing optional object still needs a valid name for the hook; it is never called then
const useCreateIfAvailable = (
  objectNameSingular: string,
  availableObjectNames: Set<string>,
) =>
  useCreateOneRecord({
    objectNameSingular: availableObjectNames.has(objectNameSingular)
      ? objectNameSingular
      : 'note',
  });

export type RoboostFollowUp = { dueAt: string; title: string };

export const useRoboostSaveActivity = () => {
  const { objectMetadataItems } = useObjectMetadataItems();
  const currentWorkspaceMember = useAtomStateValue(currentWorkspaceMemberState);
  const apolloCoreClient = useApolloCoreClient();
  const availableObjectNames = new Set(
    objectMetadataItems
      .filter((item) => item.isActive)
      .map((item) => item.nameSingular),
  );

  const creators: Record<string, ReturnType<typeof useCreateOneRecord>> = {
    note: useCreateIfAvailable('note', availableObjectNames),
    noteTarget: useCreateIfAvailable('noteTarget', availableObjectNames),
    call: useCreateIfAvailable('call', availableObjectNames),
    callTarget: useCreateIfAvailable('callTarget', availableObjectNames),
    task: useCreateIfAvailable('task', availableObjectNames),
    taskTarget: useCreateIfAvailable('taskTarget', availableObjectNames),
    communication: useCreateIfAvailable('communication', availableObjectNames),
    communicationTarget: useCreateIfAvailable(
      'communicationTarget',
      availableObjectNames,
    ),
    calendarEvent: useCreateIfAvailable('calendarEvent', availableObjectNames),
    calendarEventTarget: useCreateIfAvailable(
      'calendarEventTarget',
      availableObjectNames,
    ),
  };

  const isTypeAvailable = (type: RoboostActivityType) =>
    availableObjectNames.has(ROBOOST_ACTIVITY_OBJECT_BY_TYPE[type]) &&
    availableObjectNames.has(`${ROBOOST_ACTIVITY_OBJECT_BY_TYPE[type]}Target`);

  const createWithTargets = async (
    objectNameSingular: string,
    input: Record<string, unknown>,
    targets: RoboostActivityTarget[],
  ) => {
    const record = await creators[objectNameSingular].createOneRecord(input);

    for (const target of targets) {
      await creators[`${objectNameSingular}Target`].createOneRecord({
        [`${objectNameSingular}Id`]: record.id,
        [`target${capitalize(target.objectNameSingular)}Id`]: target.recordId,
      });
    }

    return record;
  };

  const saveActivity = async ({
    type,
    input,
    targets,
    followUp,
  }: {
    type: RoboostActivityType;
    input: Record<string, unknown>;
    targets: RoboostActivityTarget[];
    followUp?: RoboostFollowUp;
  }) => {
    const record = await createWithTargets(
      ROBOOST_ACTIVITY_OBJECT_BY_TYPE[type],
      input,
      targets,
    );

    if (isDefined(followUp)) {
      await createWithTargets(
        'task',
        {
          title: followUp.title,
          dueAt: followUp.dueAt,
          status: 'TODO',
          ...(isDefined(currentWorkspaceMember)
            ? { assigneeId: currentWorkspaceMember.id }
            : {}),
        },
        targets,
      );
    }

    // Feeds read activities through their junctions, so refresh what is on screen
    await apolloCoreClient.refetchQueries({ include: 'active' });

    return record;
  };

  return {
    saveActivity,
    isTypeAvailable,
    currentWorkspaceMemberId: currentWorkspaceMember?.id,
  };
};
