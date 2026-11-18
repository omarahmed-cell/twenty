import { Injectable } from '@nestjs/common';

import { type ObjectRecordBaseEvent } from 'twenty-shared/database-events';
import { isDefined } from 'twenty-shared/utils';

import { OnDatabaseBatchEvent } from 'src/engine/api/graphql/graphql-query-runner/decorators/on-database-batch-event.decorator';
import { DatabaseEventAction } from 'src/engine/api/graphql/graphql-query-runner/enums/database-event-action';
import { InjectMessageQueue } from 'src/engine/core-modules/message-queue/decorators/message-queue.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';
import { type WorkspaceEventBatch } from 'src/engine/workspace-event-emitter/types/workspace-event-batch.type';
import { isImportWrite } from 'src/modules/assigned-date-tracking/utils/is-import-write.util';
import {
  TaskCalculatedFieldsJob,
  type TaskCalculatedFieldsJobData,
} from 'src/modules/task-calculated-fields/jobs/task-calculated-fields.job';
import { computeTaskCalculatedFieldUpdates } from 'src/modules/task-calculated-fields/utils/compute-task-calculated-field-updates.util';

type TaskEvent = ObjectRecordBaseEvent<Record<string, unknown>>;

type TaskEventBatch = WorkspaceEventBatch<TaskEvent>;

const getActorWorkspaceMemberId = (event: TaskEvent, isUpdate: boolean) => {
  const actor = event.properties?.after?.[
    isUpdate ? 'updatedBy' : 'createdBy'
  ] as { workspaceMemberId?: string | null } | undefined;

  return event.workspaceMemberId ?? actor?.workspaceMemberId ?? undefined;
};

// UPSERTED is emitted next to every CREATED and UPDATED, so it is not handled again
@Injectable()
export class TaskCalculatedFieldsListener {
  constructor(
    @InjectMessageQueue(MessageQueue.workspaceQueue)
    private readonly messageQueueService: MessageQueueService,
  ) {}

  @OnDatabaseBatchEvent('task', DatabaseEventAction.CREATED)
  async handleCreated(batch: TaskEventBatch) {
    await this.handleBatch(batch, false);
  }

  @OnDatabaseBatchEvent('task', DatabaseEventAction.UPDATED)
  async handleUpdated(batch: TaskEventBatch) {
    await this.handleBatch(batch, true);
  }

  private async handleBatch(batch: TaskEventBatch, isUpdate: boolean) {
    const now = new Date();

    const updates = batch.events
      .map((event) => {
        const after = event.properties?.after;
        const recordId = event.recordId ?? (after?.id as string | undefined);

        if (!isDefined(recordId)) {
          return null;
        }

        const values = computeTaskCalculatedFieldUpdates({
          before: event.properties?.before,
          after,
          isUpdate,
          isImport: isImportWrite(after, isUpdate),
          actorWorkspaceMemberId: getActorWorkspaceMemberId(event, isUpdate),
          now,
        });

        return Object.keys(values).length > 0 ? { recordId, values } : null;
      })
      .filter(isDefined);

    if (updates.length === 0) {
      return;
    }

    await this.messageQueueService.add<TaskCalculatedFieldsJobData>(
      TaskCalculatedFieldsJob.name,
      { workspaceId: batch.workspaceId, updates },
    );
  }
}
