import { Injectable } from '@nestjs/common';

import { STANDARD_OBJECTS } from 'twenty-shared/metadata';
import { isDefined } from 'twenty-shared/utils';
import { In, IsNull, Not } from 'typeorm';

import { WorkspaceOrmManager } from 'src/engine/twenty-orm/workspace-orm.manager';
import { getWorkspaceContext } from 'src/engine/twenty-orm/storage/orm-workspace-context.storage';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
import { type CalendarEventTargetWorkspaceEntity } from 'src/modules/calendar/common/standard-objects/calendar-event-target.workspace-entity';
import { type CalendarEventWorkspaceEntity } from 'src/modules/calendar/common/standard-objects/calendar-event.workspace-entity';
import { TimelineActivityRepository } from 'src/modules/timeline/repositories/timeline-activity.repository';
import { TimelineActivityTypeCacheService } from 'src/modules/timeline/services/timeline-activity-type-cache.service';
import { type TimelineActivityPayload } from 'src/modules/timeline/types/timeline-activity-payload.type';

// Meeting timeline entries route through participants, which only reach people, so a
// company linked to a meeting gets its "attended a meeting" entry written here
@Injectable()
export class CalendarEventCompanyTimelineService {
  constructor(
    private readonly workspaceOrmManager: WorkspaceOrmManager,
    private readonly timelineActivityRepository: TimelineActivityRepository,
    private readonly timelineActivityTypeCacheService: TimelineActivityTypeCacheService,
  ) {}

  async addCompanyTimelineActivities({
    workspaceId,
    calendarEventTargetIds,
  }: {
    workspaceId: string;
    calendarEventTargetIds: string[];
  }): Promise<void> {
    if (calendarEventTargetIds.length === 0) {
      return;
    }

    const resolveTimelineActivityType =
      await this.timelineActivityTypeCacheService.getTimelineActivityTypeResolver(
        workspaceId,
      );

    const timelineActivityType = resolveTimelineActivityType({
      action: 'linked',
      objectUniversalIdentifier:
        STANDARD_OBJECTS.calendarEvent.universalIdentifier,
    });

    if (!isDefined(timelineActivityType)) {
      return;
    }

    const payloads = await this.workspaceOrmManager.executeInWorkspaceContext(
      async () => {
        const { objectIdByNameSingular } = getWorkspaceContext();

        const companyTargets = await this.workspaceOrmManager
          .getRepository<CalendarEventTargetWorkspaceEntity>(
            'calendarEventTarget',
            { shouldBypassPermissionChecks: true },
          )
          .find({
            where: {
              id: In(calendarEventTargetIds),
              targetCompanyId: Not(IsNull()),
            },
          });

        if (companyTargets.length === 0) {
          return [];
        }

        const calendarEventIds = [
          ...new Set(companyTargets.map((target) => target.calendarEventId)),
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
          .getRepository<{
            targetCompanyId: string | null;
            linkedRecordId: string | null;
          }>('timelineActivity', { shouldBypassPermissionChecks: true })
          .find({
            select: { targetCompanyId: true, linkedRecordId: true },
            where: {
              timelineActivityTypeId: timelineActivityType.id,
              linkedRecordId: In(calendarEventIds),
              targetCompanyId: In(
                companyTargets.map((target) => target.targetCompanyId),
              ),
            },
          });

        const loggedKeys = new Set(
          existingTimelineActivities.map(
            ({ targetCompanyId, linkedRecordId }) =>
              `${linkedRecordId}:${targetCompanyId}`,
          ),
        );

        return companyTargets.flatMap((target): TimelineActivityPayload[] => {
          const calendarEvent = calendarEventById.get(target.calendarEventId);
          const key = `${target.calendarEventId}:${target.targetCompanyId}`;

          if (
            !isDefined(calendarEvent) ||
            !isDefined(target.targetCompanyId) ||
            loggedKeys.has(key)
          ) {
            return [];
          }

          loggedKeys.add(key);

          return [
            {
              happensAt: new Date(calendarEvent.startsAt ?? Date.now()),
              timelineActivityTypeId: timelineActivityType.id,
              timelineActivityTypeSnapshot: timelineActivityType.snapshot,
              objectSingularName: 'company',
              recordId: target.targetCompanyId,
              linkedRecordId: calendarEvent.id,
              linkedObjectMetadataId: objectIdByNameSingular['calendarEvent'],
              linkedRecordCachedName: calendarEvent.title ?? undefined,
              properties: {},
            },
          ];
        });
      },
      buildSystemAuthContext(workspaceId),
    );

    if (payloads.length === 0) {
      return;
    }

    await this.timelineActivityRepository.upsertTimelineActivities({
      objectSingularName: 'company',
      workspaceId,
      payloads,
    });
  }
}
