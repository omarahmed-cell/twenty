import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { isDefined } from 'twenty-shared/utils';

import { InjectMessageQueue } from 'src/engine/core-modules/message-queue/decorators/message-queue.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';
import { type MetadataEventBatch } from 'src/engine/subscriptions/metadata-event/types/metadata-event-batch.type';
import { type FlatFieldMetadata } from 'src/engine/metadata-modules/flat-field-metadata/types/flat-field-metadata.type';
import {
  FieldSyncJob,
  type FieldSyncJobData,
} from 'src/modules/field-sync/jobs/field-sync.job';
import { getFieldSyncSettings } from 'src/modules/field-sync/utils/resolve-field-sync-configs.util';

type FieldMetadataEventBatch = MetadataEventBatch<
  'fieldMetadata',
  'created' | 'updated'
>;

@Injectable()
export class FieldSyncMetadataListener {
  constructor(
    @InjectMessageQueue(MessageQueue.workspaceQueue)
    private readonly messageQueueService: MessageQueueService,
  ) {}

  @OnEvent('metadata.fieldMetadata.created')
  async handleFieldCreated(payload: FieldMetadataEventBatch) {
    await this.backfillSyncedFields(payload);
  }

  // Re-runs only when the sync config itself changes, not on label or icon edits.
  @OnEvent('metadata.fieldMetadata.updated')
  async handleFieldUpdated(payload: FieldMetadataEventBatch) {
    await this.backfillSyncedFields({
      ...payload,
      events: payload.events.filter(
        (event) =>
          event.type === 'updated' &&
          JSON.stringify(
            getFieldSyncSettings(
              event.properties.before as FlatFieldMetadata,
            ) ?? null,
          ) !==
            JSON.stringify(
              getFieldSyncSettings(
                event.properties.after as FlatFieldMetadata,
              ) ?? null,
            ),
      ),
    });
  }

  private async backfillSyncedFields(payload: FieldMetadataEventBatch) {
    for (const event of payload.events) {
      if (!('after' in event.properties)) {
        continue;
      }

      const field = event.properties.after as FlatFieldMetadata;

      if (!isDefined(getFieldSyncSettings(field))) {
        continue;
      }

      await this.messageQueueService.add<FieldSyncJobData>(FieldSyncJob.name, {
        type: 'BACKFILL',
        workspaceId: payload.workspaceId,
        targetFieldId: field.id,
      });
    }
  }
}
