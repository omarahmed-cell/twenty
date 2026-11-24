import { Injectable } from '@nestjs/common';

import { isNonEmptyString } from '@sniptt/guards';
import { type ObjectRecordBaseEvent } from 'twenty-shared/database-events';
import { type ActorMetadata } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

import { OnDatabaseBatchEvent } from 'src/engine/api/graphql/graphql-query-runner/decorators/on-database-batch-event.decorator';
import { DatabaseEventAction } from 'src/engine/api/graphql/graphql-query-runner/enums/database-event-action';
import { InjectMessageQueue } from 'src/engine/core-modules/message-queue/decorators/message-queue.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';
import { type WorkspaceEventBatch } from 'src/engine/workspace-event-emitter/types/workspace-event-batch.type';
import {
  type RoboostTaskChange,
  RoboostTaskNotificationJob,
  type RoboostTaskNotificationJobData,
} from 'src/modules/roboost-notification/jobs/roboost-task-notification.job';

type TaskEventBatch = WorkspaceEventBatch<
  ObjectRecordBaseEvent<Record<string, unknown>>
>;

const toIso = (value: unknown): string | null =>
  isDefined(value) && value !== ''
    ? new Date(value as string).toISOString()
    : null;

// API keys (the loader) and system writes never notify a task assignment
const getAssigner = (actor: ActorMetadata | undefined) =>
  isDefined(actor) &&
  actor.source !== 'API' &&
  actor.source !== 'SYSTEM' &&
  (actor.source !== 'IMPORT' || isNonEmptyString(actor.workspaceMemberId))
    ? {
        workspaceMemberId: isNonEmptyString(actor.workspaceMemberId)
          ? actor.workspaceMemberId
          : null,
        name: isNonEmptyString(actor.name) ? actor.name : 'Someone',
      }
    : null;

@Injectable()
export class RoboostTaskNotificationListener {
  constructor(
    @InjectMessageQueue(MessageQueue.workspaceQueue)
    private readonly messageQueueService: MessageQueueService,
  ) {}

  @OnDatabaseBatchEvent('task', DatabaseEventAction.CREATED)
  async handleCreated(batch: TaskEventBatch) {
    await this.handleBatch(batch, 'created');
  }

  @OnDatabaseBatchEvent('task', DatabaseEventAction.UPDATED)
  async handleUpdated(batch: TaskEventBatch) {
    await this.handleBatch(batch, 'updated');
  }

  @OnDatabaseBatchEvent('task', DatabaseEventAction.DELETED)
  async handleDeleted(batch: TaskEventBatch) {
    await this.handleBatch(batch, 'deleted');
  }

  private async handleBatch(
    batch: TaskEventBatch,
    action: 'created' | 'updated' | 'deleted',
  ) {
    const changes: RoboostTaskChange[] = batch.events.flatMap((event) => {
      const after = event.properties?.after ?? event.properties?.before;
      const before = event.properties?.before;
      const taskId = event.recordId ?? (after?.id as string | undefined);

      if (!isDefined(after) || !isDefined(taskId)) {
        return [];
      }

      const isNew = action === 'created';
      const assigneeId = (after.assigneeId as string | null) ?? null;
      const actor = (isNew ? after.createdBy : after.updatedBy) as
        | ActorMetadata
        | undefined;
      const assigner = getAssigner(actor);
      const isReassigned =
        isNonEmptyString(assigneeId) &&
        (isNew || assigneeId !== before?.assigneeId) &&
        assigneeId !== assigner?.workspaceMemberId;

      return [
        {
          taskId,
          title: (after.title as string | null) ?? null,
          dueAt: toIso(after.dueAt),
          assigneeId,
          isClosed: action === 'deleted' || after.status === 'DONE',
          isNew,
          dueChanged: !isNew && toIso(after.dueAt) !== toIso(before?.dueAt),
          assignedBy:
            action !== 'deleted' && isReassigned && isDefined(assigner)
              ? assigner
              : null,
        },
      ];
    });

    if (changes.length === 0) {
      return;
    }

    await this.messageQueueService.add<RoboostTaskNotificationJobData>(
      RoboostTaskNotificationJob.name,
      { workspaceId: batch.workspaceId, changes },
    );
  }
}
