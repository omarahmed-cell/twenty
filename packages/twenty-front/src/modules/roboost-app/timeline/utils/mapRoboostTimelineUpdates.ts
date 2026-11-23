import { type TimelineActivity } from '@/activities/timeline-activities/types/TimelineActivity';
import { findFieldMetadataItemByDiffKey } from '@/activities/timeline-activities/utils/findFieldMetadataItemByDiffKey';
import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { getRoboostFieldHistorySource } from '@/roboost-app/history/utils/getRoboostFieldHistorySource';
import { type RoboostActivityTypeKey } from '@/roboost-app/timeline/types/RoboostActivityTypeKey';
import { type RoboostFeedItem } from '@/roboost-app/types/RoboostFeedItem';
import { formatRoboostFieldValue } from '@/roboost-app/utils/formatRoboostFieldValue';
import { getRoboostPersonName } from '@/roboost-app/utils/getRoboostPersonName';
import { isNonEmptyString } from '@sniptt/guards';
import { type ActorMetadata } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import { FieldMetadataType } from '~/generated-metadata/graphql';

// Activities already have their own cards, so their "linked" rows would only repeat them
const ACTIVITY_OBJECT_NAMES = new Set([
  'note',
  'task',
  'call',
  'communication',
  'calendarEvent',
  'meeting',
  'meetingAttendee',
  'email',
  'emailTrackingEvent',
  'message',
  'messageThread',
  'attachment',
]);

const isStageField = (field: FieldMetadataItem) =>
  field.type === FieldMetadataType.SELECT && /stage/i.test(field.name);

export type RoboostTimelineUpdateLabels = {
  created: (objectLabel: string) => string;
  changed: (fieldLabels: string) => string;
  deleted: (objectLabel: string) => string;
  restored: (objectLabel: string) => string;
  linked: (linkedName: string) => string;
  unlinked: (linkedName: string) => string;
  updated: string;
  empty: string;
};

export const mapRoboostTimelineUpdates = ({
  timelineActivities,
  getAction,
  fields,
  objectLabel,
  linkedObjectNameById,
  labels,
}: {
  timelineActivities: TimelineActivity[];
  getAction: (timelineActivity: TimelineActivity) => string | null;
  fields: FieldMetadataItem[];
  objectLabel: string;
  linkedObjectNameById: Map<string, string>;
  labels: RoboostTimelineUpdateLabels;
}): RoboostFeedItem[] =>
  timelineActivities.flatMap((timelineActivity): RoboostFeedItem[] => {
    const action = getAction(timelineActivity);
    const updatedBy = timelineActivity.properties?.updatedBy as
      | ActorMetadata
      | undefined;
    const memberName = getRoboostPersonName(
      timelineActivity.workspaceMember?.name,
    );
    const actorName = isNonEmptyString(updatedBy?.name)
      ? updatedBy.name
      : memberName;
    const base = {
      id: `update-${timelineActivity.id}`,
      kind: 'update' as const,
      recordId: null,
      objectNameSingular: null,
      date: timelineActivity.happensAt,
      ownerId: timelineActivity.workspaceMemberId ?? null,
      ownerName: actorName,
      creatorId: timelineActivity.workspaceMemberId ?? null,
      meta: '',
    };
    const build = (
      typeKey: RoboostActivityTypeKey,
      title: string,
      body = '',
    ): RoboostFeedItem[] => [{ ...base, typeKey, title, body }];

    if (isDefined(timelineActivity.linkedRecordId)) {
      const linkedObjectName = isDefined(
        timelineActivity.linkedObjectMetadataId,
      )
        ? linkedObjectNameById.get(timelineActivity.linkedObjectMetadataId)
        : undefined;

      if (
        !isDefined(linkedObjectName) ||
        ACTIVITY_OBJECT_NAMES.has(linkedObjectName)
      ) {
        return [];
      }
      const linkedName = isNonEmptyString(
        timelineActivity.linkedRecordCachedName as string | undefined,
      )
        ? (timelineActivity.linkedRecordCachedName as string)
        : linkedObjectName;

      if (action === 'linked' || action === 'created') {
        return build('associations', labels.linked(linkedName));
      }
      if (action === 'unlinked' || action === 'deleted') {
        return build('associations', labels.unlinked(linkedName));
      }

      return [];
    }

    switch (action) {
      case 'created':
        return build('recordCreated', labels.created(objectLabel));
      case 'deleted':
        return build('otherUpdates', labels.deleted(objectLabel));
      case 'restored':
        return build('otherUpdates', labels.restored(objectLabel));
      case 'updated': {
        const diff = timelineActivity.properties?.diff ?? {};
        const changes = Object.entries(diff).flatMap(([diffKey, change]) => {
          const field = findFieldMetadataItemByDiffKey(fields, diffKey);

          return isDefined(field) && field.isSystem !== true
            ? [{ field, after: change?.after }]
            : [];
        });

        if (changes.length === 0) {
          return [];
        }
        const isWorkflow =
          getRoboostFieldHistorySource({
            updatedBy,
            workspaceMemberId: timelineActivity.workspaceMemberId,
          }) === 'workflow';
        const typeKey: RoboostActivityTypeKey = isWorkflow
          ? 'workflowActivity'
          : changes.some(({ field }) => isStageField(field))
            ? 'stageChanges'
            : 'fieldChanges';
        const body = changes
          .map(({ field, after }) => {
            const value =
              field.type === FieldMetadataType.RELATION
                ? ''
                : formatRoboostFieldValue(field, after);

            return value === '' ? field.label : `${field.label} → ${value}`;
          })
          .join(' · ');

        return build(
          typeKey,
          labels.changed(changes.map(({ field }) => field.label).join(', ')),
          body === '' ? labels.empty : body,
        );
      }
      default:
        return isDefined(action) ? build('otherUpdates', labels.updated) : [];
    }
  });
