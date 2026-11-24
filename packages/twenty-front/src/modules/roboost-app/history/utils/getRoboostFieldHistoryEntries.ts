import { type TimelineActivity } from '@/activities/timeline-activities/types/TimelineActivity';
import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { type RoboostFieldHistoryEntry } from '@/roboost-app/history/types/RoboostFieldHistoryEntry';
import { getRoboostFieldHistorySource } from '@/roboost-app/history/utils/getRoboostFieldHistorySource';
import { getRoboostPersonName } from '@/roboost-app/utils/getRoboostPersonName';
import { isNonEmptyString } from '@sniptt/guards';
import { type ActorMetadata } from 'twenty-shared/types';
import {
  computeRelationGqlFieldJoinColumnName,
  isDefined,
} from 'twenty-shared/utils';

export const getRoboostFieldHistoryDiffKeys = (
  field: Pick<FieldMetadataItem, 'name' | 'settings'>,
) => [
  field.name,
  (field.settings as { joinColumnName?: string } | null | undefined)
    ?.joinColumnName ??
    computeRelationGqlFieldJoinColumnName({ name: field.name }),
];

// Newest first; only the record's own update rows that touched this field
export const getRoboostFieldHistoryEntries = ({
  timelineActivities,
  field,
  isUpdateRow,
}: {
  timelineActivities: TimelineActivity[];
  field: Pick<FieldMetadataItem, 'name' | 'settings'>;
  isUpdateRow: (timelineActivity: TimelineActivity) => boolean;
}): RoboostFieldHistoryEntry[] => {
  const diffKeys = getRoboostFieldHistoryDiffKeys(field);

  return timelineActivities
    .filter(
      (timelineActivity) =>
        !isDefined(timelineActivity.linkedRecordId) &&
        isUpdateRow(timelineActivity),
    )
    .flatMap((timelineActivity) => {
      const diff = timelineActivity.properties?.diff ?? {};
      const diffKey = diffKeys.find((key) => isDefined(diff[key]));

      if (!isDefined(diffKey)) {
        return [];
      }

      const updatedBy = timelineActivity.properties?.updatedBy as
        | ActorMetadata
        | undefined;
      const source = getRoboostFieldHistorySource({
        updatedBy,
        workspaceMemberId: timelineActivity.workspaceMemberId,
        isCalculated: timelineActivity.properties?.isCalculated === true,
      });
      const memberName = getRoboostPersonName(
        timelineActivity.workspaceMember?.name,
      );

      return [
        {
          id: timelineActivity.id,
          before: diff[diffKey].before,
          after: diff[diffKey].after,
          happensAt: timelineActivity.happensAt,
          source,
          actorName: isNonEmptyString(updatedBy?.name)
            ? updatedBy.name
            : isNonEmptyString(memberName)
              ? memberName
              : null,
          workflowId: updatedBy?.context?.workflowId ?? null,
        },
      ];
    })
    .sort((first, second) => second.happensAt.localeCompare(first.happensAt));
};
