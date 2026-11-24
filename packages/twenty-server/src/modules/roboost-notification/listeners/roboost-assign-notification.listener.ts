import { Injectable } from '@nestjs/common';

import { type ObjectRecordBaseEvent } from 'twenty-shared/database-events';
import { isDefined } from 'twenty-shared/utils';

import { OnDatabaseBatchEvent } from 'src/engine/api/graphql/graphql-query-runner/decorators/on-database-batch-event.decorator';
import { DatabaseEventAction } from 'src/engine/api/graphql/graphql-query-runner/enums/database-event-action';
import { InjectMessageQueue } from 'src/engine/core-modules/message-queue/decorators/message-queue.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';
import { type WorkspaceEventBatch } from 'src/engine/workspace-event-emitter/types/workspace-event-batch.type';
import { ROBOOST_ASSIGN_OWNER_FIELDS } from 'src/modules/roboost-notification/constants/roboost-assign-owner-fields.constant';
import {
  RoboostAssignNotificationJob,
  type RoboostAssignNotificationJobData,
} from 'src/modules/roboost-notification/jobs/roboost-assign-notification.job';
import { extractRoboostAssignments } from 'src/modules/roboost-notification/utils/extract-roboost-assignments.util';

type RecordEventBatch = WorkspaceEventBatch<
  ObjectRecordBaseEvent<Record<string, unknown>>
>;

// UPSERTED repeats CREATED/UPDATED for the same write, so only those two are handled
@Injectable()
export class RoboostAssignNotificationListener {
  constructor(
    @InjectMessageQueue(MessageQueue.workspaceQueue)
    private readonly messageQueueService: MessageQueueService,
  ) {}

  @OnDatabaseBatchEvent('*', DatabaseEventAction.CREATED)
  async handleCreated(batch: RecordEventBatch) {
    await this.handleBatch(batch, true);
  }

  @OnDatabaseBatchEvent('*', DatabaseEventAction.UPDATED)
  async handleUpdated(batch: RecordEventBatch) {
    await this.handleBatch(batch, false);
  }

  private async handleBatch(batch: RecordEventBatch, isCreate: boolean) {
    const objectMetadata = batch.objectMetadata;
    const ownerFields = isDefined(objectMetadata)
      ? ROBOOST_ASSIGN_OWNER_FIELDS[objectMetadata.nameSingular]
      : undefined;

    if (!isDefined(objectMetadata) || !isDefined(ownerFields)) {
      return;
    }

    for (const { actor, assignments } of extractRoboostAssignments({
      events: batch.events,
      ownerFields,
      isCreate,
    })) {
      await this.messageQueueService.add<RoboostAssignNotificationJobData>(
        RoboostAssignNotificationJob.name,
        {
          workspaceId: batch.workspaceId,
          objectMetadataId: objectMetadata.id,
          objectNameSingular: objectMetadata.nameSingular,
          objectNamePlural: objectMetadata.namePlural,
          actor,
          assignments,
        },
      );
    }
  }
}
