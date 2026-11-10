import { Injectable } from '@nestjs/common';

import { STANDARD_OBJECTS } from 'twenty-shared/metadata';
import { isDefined } from 'twenty-shared/utils';
import { In, IsNull, Not } from 'typeorm';

import { STANDARD_TIMELINE_ACTIVITY_TYPE_DEFINITIONS } from 'src/engine/metadata-modules/timeline-activity-type/constants/standard-timeline-activity-type-definitions.constant';
import { WorkspaceOrmManager } from 'src/engine/twenty-orm/workspace-orm.manager';
import { getWorkspaceContext } from 'src/engine/twenty-orm/storage/orm-workspace-context.storage';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
import { type CalendarEventTargetWorkspaceEntity } from 'src/modules/calendar/common/standard-objects/calendar-event-target.workspace-entity';
import { type CalendarEventWorkspaceEntity } from 'src/modules/calendar/common/standard-objects/calendar-event.workspace-entity';
import { TimelineActivityRepository } from 'src/modules/timeline/repositories/timeline-activity.repository';
import { TimelineActivityTypeCacheService } from 'src/modules/timeline/services/timeline-activity-type-cache.service';
import { type TimelineActivityPayload } from 'src/modules/timeline/types/timeline-activity-payload.type';
import { type ResolvedTimelineActivityType } from 'src/modules/timeline/utils/resolve-timeline-activity-type.util';

const LINKED_TARGETS = [
  { objectSingularName: 'company', targetFieldName: 'targetCompanyId' },
  { objectSingularName: 'opportunity', targetFieldName: 'targetOpportunityId' },
] as const;

const CALENDAR_EVENT_LINKED_UNIVERSAL_IDENTIFIER =
  STANDARD_TIMELINE_ACTIVITY_TYPE_DEFINITIONS.find(
    ({ name }) => name === 'calendarEventLinked',
  )?.universalIdentifier;

// Meeting timeline entries route through participants, which only reach people, so a
// company or deal linked to a meeting gets its "attended a meeting" entry written here
@Injectable()
export class CalendarEventCompanyTimelineService {
  constructor(
    private readonly workspaceOrmManager: WorkspaceOrmManager,
    private readonly timelineActivityRepository: TimelineActivityRepository,
    private readonly timelineActivityTypeCacheService: TimelineActivityTypeCacheService,
  ) {}

  async addLinkedRecordTimelineActivities({
    workspaceId,
    calendarEventTargetIds,
  }: {
    workspaceId: string;
    calendarEventTargetIds: string[];
  }): Promise<void> {
    if (calendarEventTargetIds.length === 0) {
      return;
    }

    const timelineActivityTypes =
      await this.resolveTimelineActivityTypes(workspaceId);

    if (timelineActivityTypes.length === 0) {
      return;
    }

    const [timelineActivityType] = timelineActivityTypes;

    const payloads = await this.workspaceOrmManager.executeInWorkspaceContext(
      async () => {
        const { objectIdByNameSingular } = getWorkspaceContext();

        const linkedTargets = await this.workspaceOrmManager
          .getRepository<CalendarEventTargetWorkspaceEntity>(
            'calendarEventTarget',
            { shouldBypassPermissionChecks: true },
          )
          .find({
            where: LINKED_TARGETS.map(({ targetFieldName }) => ({
              id: In(calendarEventTargetIds),
              [targetFieldName]: Not(IsNull()),
            })),
          });

        if (linkedTargets.length === 0) {
          return [];
        }

        const calendarEventIds = [
          ...new Set(linkedTargets.map((target) => target.calendarEventId)),
        ];

        const calendarEvents = await this.workspaceOrmManager
          .getRepository<CalendarEventWorkspaceEntity>('calendarEvent', {
            shouldBypassPermissionChecks: true,
          })
          .find({
            select: { id: true, title: true, startsAt: true },
            where: { id: In(calendarEventIds) },
          });

        const calendarEventById = new Map(
          calendarEvents.map((calendarEvent) => [
            calendarEvent.id,
            calendarEvent,
          ]),
        );

        const existingTimelineActivities = await this.workspaceOrmManager
          .getRepository<
            Record<string, string | null> & { linkedRecordId: string | null }
          >('timelineActivity', { shouldBypassPermissionChecks: true })
          .find({
            where: {
              timelineActivityTypeId: In(
                timelineActivityTypes.map(({ id }) => id),
              ),
              linkedRecordId: In(calendarEventIds),
            },
          });

        const loggedKeys = new Set(
          existingTimelineActivities.flatMap((timelineActivity) =>
            LINKED_TARGETS.map(
              ({ targetFieldName }) =>
                `${timelineActivity.linkedRecordId}:${timelineActivity[targetFieldName]}`,
            ),
          ),
        );

        return linkedTargets.flatMap((target): TimelineActivityPayload[] => {
          const calendarEvent = calendarEventById.get(target.calendarEventId);

          if (!isDefined(calendarEvent)) {
            return [];
          }

          return LINKED_TARGETS.flatMap(
            ({ objectSingularName, targetFieldName }) => {
              const recordId = target[targetFieldName];
              const key = `${calendarEvent.id}:${recordId}`;

              if (!isDefined(recordId) || loggedKeys.has(key)) {
                return [];
              }

              loggedKeys.add(key);

              return [
                {
                  happensAt: new Date(calendarEvent.startsAt ?? Date.now()),
                  timelineActivityTypeId: timelineActivityType.id,
                  timelineActivityTypeSnapshot: timelineActivityType.snapshot,
                  objectSingularName,
                  recordId,
                  linkedRecordId: calendarEvent.id,
                  linkedObjectMetadataId:
                    objectIdByNameSingular['calendarEvent'],
                  linkedRecordCachedName: calendarEvent.title ?? undefined,
                  properties: {},
                },
              ];
            },
          );
        });
      },
      buildSystemAuthContext(workspaceId),
    );

    for (const { objectSingularName } of LINKED_TARGETS) {
      const objectPayloads = payloads.filter(
        (payload) => payload.objectSingularName === objectSingularName,
      );

      if (objectPayloads.length === 0) {
        continue;
      }

      await this.timelineActivityRepository.upsertTimelineActivities({
        objectSingularName,
        workspaceId,
        payloads: objectPayloads,
      });
    }
  }

  // The meeting type first; the generic linked type is what older rows were written with
  private async resolveTimelineActivityTypes(
    workspaceId: string,
  ): Promise<ResolvedTimelineActivityType[]> {
    const calendarEventLinkedType = isDefined(
      CALENDAR_EVENT_LINKED_UNIVERSAL_IDENTIFIER,
    )
      ? await this.timelineActivityTypeCacheService.findActiveTimelineActivityTypeByUniversalIdentifier(
          {
            workspaceId,
            universalIdentifier: CALENDAR_EVENT_LINKED_UNIVERSAL_IDENTIFIER,
          },
        )
      : undefined;

    const resolveTimelineActivityType =
      await this.timelineActivityTypeCacheService.getTimelineActivityTypeResolver(
        workspaceId,
      );

    const genericLinkedType = resolveTimelineActivityType({
      action: 'linked',
      objectUniversalIdentifier:
        STANDARD_OBJECTS.calendarEvent.universalIdentifier,
    });

    return [calendarEventLinkedType, genericLinkedType].filter(isDefined);
  }
}
