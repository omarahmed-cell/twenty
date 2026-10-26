import { Injectable } from '@nestjs/common';

import {
  type ObjectRecordCreateEvent,
  type ObjectRecordUpdateEvent,
} from 'twenty-shared/database-events';

import { OnDatabaseBatchEvent } from 'src/engine/api/graphql/graphql-query-runner/decorators/on-database-batch-event.decorator';
import { DatabaseEventAction } from 'src/engine/api/graphql/graphql-query-runner/enums/database-event-action';
import { InjectMessageQueue } from 'src/engine/core-modules/message-queue/decorators/message-queue.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';
import { WorkspaceEventBatch } from 'src/engine/workspace-event-emitter/types/workspace-event-batch.type';
import {
  CalendarEventAssignedToAutoFillJob,
  type CalendarEventAssignedToAutoFillJobData,
} from 'src/modules/calendar/calendar-event-assigned-to/jobs/calendar-event-assigned-to-auto-fill.job';
import { type CalendarEventParticipantWorkspaceEntity } from 'src/modules/calendar/common/standard-objects/calendar-event-participant.workspace-entity';

// Guests arrive through sync inserts and get matched to workspace members by later updates
@Injectable()
export class CalendarEventAssignedToAutoFillListener {
  constructor(
    @InjectMessageQueue(MessageQueue.calendarQueue)
    private readonly messageQueueService: MessageQueueService,
  ) {}

  @OnDatabaseBatchEvent('calendarEventParticipant', DatabaseEventAction.CREATED)
  async handleCreatedEvent(
    payload: WorkspaceEventBatch<
      ObjectRecordCreateEvent<CalendarEventParticipantWorkspaceEntity>
    >,
  ) {
    await this.enqueue(
      payload.workspaceId,
      payload.events.map(({ properties }) => properties.after.calendarEventId),
    );
  }

  @OnDatabaseBatchEvent('calendarEventParticipant', DatabaseEventAction.UPDATED)
  async handleUpdatedEvent(
    payload: WorkspaceEventBatch<
      ObjectRecordUpdateEvent<CalendarEventParticipantWorkspaceEntity>
    >,
  ) {
    await this.enqueue(
      payload.workspaceId,
      payload.events
        .filter(
          ({ properties }) =>
            properties.before.workspaceMemberId !==
              properties.after.workspaceMemberId ||
            properties.before.isOrganizer !== properties.after.isOrganizer,
        )
        .map(({ properties }) => properties.after.calendarEventId),
    );
  }

  private async enqueue(workspaceId: string, calendarEventIds: string[]) {
    const uniqueCalendarEventIds = [...new Set(calendarEventIds)].filter(
      Boolean,
    );

    if (uniqueCalendarEventIds.length === 0) {
      return;
    }

    await this.messageQueueService.add<CalendarEventAssignedToAutoFillJobData>(
      CalendarEventAssignedToAutoFillJob.name,
      { workspaceId, calendarEventIds: uniqueCalendarEventIds },
    );
  }
}
