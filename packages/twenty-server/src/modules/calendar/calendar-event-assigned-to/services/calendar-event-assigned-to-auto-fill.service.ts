import { Injectable } from '@nestjs/common';

import { isDefined } from 'twenty-shared/utils';
import { In, IsNull } from 'typeorm';

import { WorkspaceOrmManager } from 'src/engine/twenty-orm/workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
import { resolveAutoAssignedWorkspaceMemberId } from 'src/modules/calendar/calendar-event-assigned-to/utils/resolve-auto-assigned-workspace-member-id.util';
import { type CalendarEventParticipantWorkspaceEntity } from 'src/modules/calendar/common/standard-objects/calendar-event-participant.workspace-entity';
import { type CalendarEventWorkspaceEntity } from 'src/modules/calendar/common/standard-objects/calendar-event.workspace-entity';

@Injectable()
export class CalendarEventAssignedToAutoFillService {
  constructor(private readonly workspaceOrmManager: WorkspaceOrmManager) {}

  // Only meetings without an assignee are filled, so a value set by hand is never replaced
  async autoFillAssignedTo({
    workspaceId,
    calendarEventIds,
  }: {
    workspaceId: string;
    calendarEventIds: string[];
  }): Promise<number> {
    if (calendarEventIds.length === 0) {
      return 0;
    }

    return this.workspaceOrmManager.executeInWorkspaceContext(async () => {
      const calendarEventRepository =
        this.workspaceOrmManager.getRepository<CalendarEventWorkspaceEntity>(
          'calendarEvent',
          { shouldBypassPermissionChecks: true },
        );

      const unassignedCalendarEvents = await calendarEventRepository.find({
        select: { id: true },
        where: { id: In(calendarEventIds), assignedToId: IsNull() },
      });

      if (unassignedCalendarEvents.length === 0) {
        return 0;
      }

      const participants = await this.workspaceOrmManager
        .getRepository<CalendarEventParticipantWorkspaceEntity>(
          'calendarEventParticipant',
          { shouldBypassPermissionChecks: true },
        )
        .find({
          select: {
            calendarEventId: true,
            isOrganizer: true,
            workspaceMemberId: true,
          },
          where: {
            calendarEventId: In(unassignedCalendarEvents.map(({ id }) => id)),
          },
        });

      let assignedCount = 0;

      for (const { id } of unassignedCalendarEvents) {
        const assignedToId = resolveAutoAssignedWorkspaceMemberId(
          participants.filter(
            (participant) => participant.calendarEventId === id,
          ),
        );

        if (!isDefined(assignedToId)) {
          continue;
        }

        // The IsNull guard keeps a concurrent manual assignment from being overwritten
        const result = await calendarEventRepository.update(
          { id, assignedToId: IsNull() },
          { assignedToId },
        );

        assignedCount += result.affected ?? 0;
      }

      return assignedCount;
    }, buildSystemAuthContext(workspaceId));
  }
}
