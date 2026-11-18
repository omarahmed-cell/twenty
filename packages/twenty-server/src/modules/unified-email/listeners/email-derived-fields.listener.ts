import { Injectable } from '@nestjs/common';

import { type ObjectRecordBaseEvent } from 'twenty-shared/database-events';
import { isDefined } from 'twenty-shared/utils';

import { OnDatabaseBatchEvent } from 'src/engine/api/graphql/graphql-query-runner/decorators/on-database-batch-event.decorator';
import { DatabaseEventAction } from 'src/engine/api/graphql/graphql-query-runner/enums/database-event-action';
import { InjectMessageQueue } from 'src/engine/core-modules/message-queue/decorators/message-queue.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';
import { type WorkspaceEventBatch } from 'src/engine/workspace-event-emitter/types/workspace-event-batch.type';
import {
  EmailDerivedFieldsJob,
  type EmailDerivedFieldsJobData,
} from 'src/modules/unified-email/jobs/email-derived-fields.job';
import { computeEmailDerivedFieldUpdates } from 'src/modules/unified-email/utils/compute-email-derived-field-updates.util';

type EmailEventBatch = WorkspaceEventBatch<
  ObjectRecordBaseEvent<Record<string, unknown>>
>;

// UPSERTED is emitted next to every CREATED and UPDATED, so it is not handled again
@Injectable()
export class EmailDerivedFieldsListener {
  constructor(
    @InjectMessageQueue(MessageQueue.workspaceQueue)
    private readonly messageQueueService: MessageQueueService,
  ) {}

  @OnDatabaseBatchEvent('email', DatabaseEventAction.CREATED)
  async handleCreated(batch: EmailEventBatch) {
    await this.handleBatch(batch, false);
  }

  @OnDatabaseBatchEvent('email', DatabaseEventAction.UPDATED)
  async handleUpdated(batch: EmailEventBatch) {
    await this.handleBatch(batch, true);
  }

  private async handleBatch(batch: EmailEventBatch, isUpdate: boolean) {
    const updates = batch.events
      .map((event) => {
        const after = event.properties?.after;
        const recordId = event.recordId ?? (after?.id as string | undefined);

        if (!isDefined(recordId)) {
          return null;
        }

        const values = computeEmailDerivedFieldUpdates({
          before: event.properties?.before,
          after,
          isUpdate,
        });

        return Object.keys(values).length > 0 ? { recordId, values } : null;
      })
      .filter(isDefined);

    if (updates.length === 0) {
      return;
    }

    await this.messageQueueService.add<EmailDerivedFieldsJobData>(
      EmailDerivedFieldsJob.name,
      { workspaceId: batch.workspaceId, updates },
    );
  }
}
