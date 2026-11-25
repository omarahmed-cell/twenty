import { type TimelineActivity } from '@/activities/timeline-activities/types/TimelineActivity';
import { type RoboostFeedItem } from '@/roboost-app/types/RoboostFeedItem';
import { getRoboostPersonName } from '@/roboost-app/utils/getRoboostPersonName';
import { isNonEmptyString } from '@sniptt/guards';
import { type ActorMetadata } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

// Field changes live only in each property's History panel, so the timeline keeps just "record created"
export const mapRoboostTimelineUpdates = ({
  timelineActivities,
  getAction,
  createdTitle,
  getMergeTitle,
}: {
  timelineActivities: TimelineActivity[];
  getAction: (timelineActivity: TimelineActivity) => string | null;
  createdTitle: string;
  getMergeTitle?: (event: string, otherRecordName: string) => string;
}): RoboostFeedItem[] =>
  timelineActivities.flatMap((timelineActivity): RoboostFeedItem[] => {
    const mergeEvent = timelineActivity.properties?.roboostEvent;

    // Merges and unmerges are written as "updated" rows with a merge marker
    if (isNonEmptyString(mergeEvent) && isDefined(getMergeTitle)) {
      const actorName = timelineActivity.properties?.actorName;

      return [
        {
          id: `update-${timelineActivity.id}`,
          kind: 'update',
          typeKey: 'recordMerged',
          recordId: null,
          objectNameSingular: null,
          date: timelineActivity.happensAt,
          ownerId: timelineActivity.workspaceMemberId ?? null,
          ownerName: isNonEmptyString(actorName)
            ? actorName
            : getRoboostPersonName(timelineActivity.workspaceMember?.name),
          creatorId: timelineActivity.workspaceMemberId ?? null,
          meta: '',
          title: getMergeTitle(
            mergeEvent,
            String(timelineActivity.properties?.otherRecordName ?? ''),
          ),
          body: '',
        },
      ];
    }

    if (
      isDefined(timelineActivity.linkedRecordId) ||
      getAction(timelineActivity) !== 'created'
    ) {
      return [];
    }

    const createdBy = timelineActivity.properties?.updatedBy as
      | ActorMetadata
      | undefined;
    const memberName = getRoboostPersonName(
      timelineActivity.workspaceMember?.name,
    );

    return [
      {
        id: `update-${timelineActivity.id}`,
        kind: 'update',
        typeKey: 'recordCreated',
        recordId: null,
        objectNameSingular: null,
        date: timelineActivity.happensAt,
        ownerId: timelineActivity.workspaceMemberId ?? null,
        ownerName: isNonEmptyString(createdBy?.name)
          ? createdBy.name
          : memberName,
        creatorId: timelineActivity.workspaceMemberId ?? null,
        meta: '',
        title: createdTitle,
        body: '',
      },
    ];
  });
