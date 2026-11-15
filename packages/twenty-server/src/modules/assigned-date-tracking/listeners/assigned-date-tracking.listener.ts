import { Injectable } from '@nestjs/common';

import { type ObjectRecordBaseEvent } from 'twenty-shared/database-events';
import { isDefined } from 'twenty-shared/utils';

import { OnDatabaseBatchEvent } from 'src/engine/api/graphql/graphql-query-runner/decorators/on-database-batch-event.decorator';
import { DatabaseEventAction } from 'src/engine/api/graphql/graphql-query-runner/enums/database-event-action';
import { InjectMessageQueue } from 'src/engine/core-modules/message-queue/decorators/message-queue.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';
import { type WorkspaceEventBatch } from 'src/engine/workspace-event-emitter/types/workspace-event-batch.type';
import { ASSIGNED_DATE_TRACKING_CONFIGS } from 'src/modules/assigned-date-tracking/constants/assigned-date-tracking-configs.constant';
import {
  AssignedDateTrackingJob,
  type AssignedDateTrackingJobData,
} from 'src/modules/assigned-date-tracking/jobs/assigned-date-tracking.job';
import { computeAssignedDateUpdates } from 'src/modules/assigned-date-tracking/utils/compute-assigned-date-updates.util';
import { isImportWrite } from 'src/modules/assigned-date-tracking/utils/is-import-write.util';

type AssignedDateEventBatch = WorkspaceEventBatch<
  ObjectRecordBaseEvent<Record<string, unknown>>
>;

// Listens to the ORM, so owner changes from the UI, API and workflows are all dated
@Injectable()
export class AssignedDateTrackingListener {
  constructor(
    @InjectMessageQueue(MessageQueue.workspaceQueue)
    private readonly messageQueueService: MessageQueueService,
  ) {}

  @OnDatabaseBatchEvent('*', DatabaseEventAction.CREATED)
  async handleCreated(batch: AssignedDateEventBatch) {
    await this.handleBatch(batch, false);
  }

  @OnDatabaseBatchEvent('*', DatabaseEventAction.UPDATED)
  async handleUpdated(batch: AssignedDateEventBatch) {
    await this.handleBatch(batch, true);
  }

  @OnDatabaseBatchEvent('*', DatabaseEventAction.UPSERTED)
  async handleUpserted(batch: AssignedDateEventBatch) {
    await this.handleBatch(batch, true);
  }

  private async handleBatch(batch: AssignedDateEventBatch, isUpdate: boolean) {
    const objectNameSingular = batch.objectMetadata?.nameSingular;
    const configs = ASSIGNED_DATE_TRACKING_CONFIGS.filter(
      (config) => config.objectNameSingular === objectNameSingular,
    );

    if (configs.length === 0) {
      return;
    }

    const changedAt = new Date().toISOString();

    const updates = batch.events
      .map((event) => {
        const before = event.properties?.before;
        const after = event.properties?.after;
        const recordId = event.recordId ?? (after?.id as string | undefined);

        if (!isDefined(recordId)) {
          return null;
        }

        const values = computeAssignedDateUpdates({
          configs,
          before,
          after,
          isUpdate,
          isImport: isImportWrite(after, isUpdate),
          changedAt,
        });

        return Object.keys(values).length > 0 ? { recordId, values } : null;
      })
      .filter(isDefined);

    if (updates.length === 0) {
      return;
    }

    await this.messageQueueService.add<AssignedDateTrackingJobData>(
      AssignedDateTrackingJob.name,
      { workspaceId: batch.workspaceId, objectNameSingular, updates },
    );
  }
}
