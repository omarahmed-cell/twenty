import { Injectable } from '@nestjs/common';

import { type ObjectRecordCreateEvent } from 'twenty-shared/database-events';

import { OnDatabaseBatchEvent } from 'src/engine/api/graphql/graphql-query-runner/decorators/on-database-batch-event.decorator';
import { DatabaseEventAction } from 'src/engine/api/graphql/graphql-query-runner/enums/database-event-action';
import { InjectMessageQueue } from 'src/engine/core-modules/message-queue/decorators/message-queue.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';
import { WorkspaceEventBatch } from 'src/engine/workspace-event-emitter/types/workspace-event-batch.type';
import {
  CalendarEventTargetCompanyCascadeJob,
  type CalendarEventTargetCompanyCascadeJobData,
} from 'src/modules/activity-target/calendar-event-target/calendar-event-target-company-cascade.job';
import { type CalendarEventTargetWorkspaceEntity } from 'src/modules/calendar/common/standard-objects/calendar-event-target.workspace-entity';

// A database listener rather than query hooks: participant sync links meetings through the ORM, outside the API
@Injectable()
export class CalendarEventTargetCompanyCascadeListener {
  constructor(
    @InjectMessageQueue(MessageQueue.calendarQueue)
    private readonly messageQueueService: MessageQueueService,
  ) {}

  @OnDatabaseBatchEvent('calendarEventTarget', DatabaseEventAction.CREATED)
  async handleCreatedEvent(
    payload: WorkspaceEventBatch<
      ObjectRecordCreateEvent<CalendarEventTargetWorkspaceEntity>
    >,
  ) {
    const calendarEventTargetIds = payload.events.map(
      ({ recordId }) => recordId,
    );

    if (calendarEventTargetIds.length === 0) {
      return;
    }

    await this.messageQueueService.add<CalendarEventTargetCompanyCascadeJobData>(
      CalendarEventTargetCompanyCascadeJob.name,
      { workspaceId: payload.workspaceId, calendarEventTargetIds },
    );
  }
}
