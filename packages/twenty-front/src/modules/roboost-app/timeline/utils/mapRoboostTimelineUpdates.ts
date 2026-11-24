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
}: {
  timelineActivities: TimelineActivity[];
  getAction: (timelineActivity: TimelineActivity) => string | null;
  createdTitle: string;
}): RoboostFeedItem[] =>
  timelineActivities.flatMap((timelineActivity): RoboostFeedItem[] => {
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
