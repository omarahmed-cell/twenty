import { Injectable } from '@nestjs/common';

import { type ObjectRecordBaseEvent } from 'twenty-shared/database-events';

import { OnDatabaseBatchEvent } from 'src/engine/api/graphql/graphql-query-runner/decorators/on-database-batch-event.decorator';
import { DatabaseEventAction } from 'src/engine/api/graphql/graphql-query-runner/enums/database-event-action';
import { InjectMessageQueue } from 'src/engine/core-modules/message-queue/decorators/message-queue.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';
import { type WorkspaceEventBatch } from 'src/engine/workspace-event-emitter/types/workspace-event-batch.type';
import { MEETING_FIELDS_JOB_NAME } from 'src/modules/meeting-fields/constants/meeting-fields-job-name.constant';
import { type MeetingFieldsJobData } from 'src/modules/meeting-fields/jobs/meeting-fields.job';
import { buildMeetingFieldUpdates } from 'src/modules/meeting-fields/utils/build-meeting-field-updates.util';
import { isWorkflowRecordWrite } from 'src/modules/workflow/workflow-executor/workflow-actions/record-crud/utils/workflow-record-write-context.storage';

type MeetingEventBatch = WorkspaceEventBatch<
  ObjectRecordBaseEvent<Record<string, unknown>>
>;

// No UPSERTED handler: the ORM emits it next to every CREATED and UPDATED
@Injectable()
export class MeetingFieldsListener {
  constructor(
    @InjectMessageQueue(MessageQueue.workspaceQueue)
    private readonly messageQueueService: MessageQueueService,
  ) {}

  @OnDatabaseBatchEvent('calendarEvent', DatabaseEventAction.CREATED)
  async handleCreated(batch: MeetingEventBatch) {
    await this.handleBatch(batch, true);
  }

  @OnDatabaseBatchEvent('calendarEvent', DatabaseEventAction.UPDATED)
  async handleUpdated(batch: MeetingEventBatch) {
    await this.handleBatch(batch, false);
  }

  private async handleBatch(batch: MeetingEventBatch, isCreate: boolean) {
    const { meetingSources, transcriptRecordIds } = buildMeetingFieldUpdates({
      events: batch.events,
      isCreate,
      isWorkflowWrite: isWorkflowRecordWrite(),
    });

    if (meetingSources.length === 0 && transcriptRecordIds.length === 0) {
      return;
    }

    await this.messageQueueService.add<MeetingFieldsJobData>(
      MEETING_FIELDS_JOB_NAME,
      {
        workspaceId: batch.workspaceId,
        meetingSources,
        transcriptRecordIds,
      },
    );
  }
}
