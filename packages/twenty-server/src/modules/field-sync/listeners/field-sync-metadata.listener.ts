import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { isDefined } from 'twenty-shared/utils';

import { InjectMessageQueue } from 'src/engine/core-modules/message-queue/decorators/message-queue.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';
import { type FlatFieldMetadata } from 'src/engine/metadata-modules/flat-field-metadata/types/flat-field-metadata.type';
import { type MetadataEventBatch } from 'src/engine/subscriptions/metadata-event/types/metadata-event-batch.type';
import {
  FieldSyncJob,
  type FieldSyncJobData,
} from 'src/modules/field-sync/jobs/field-sync.job';
import { FieldSyncService } from 'src/modules/field-sync/services/field-sync.service';
import { type SyncedFieldOption } from 'src/modules/field-sync/utils/build-synced-field-options.util';
import { getFieldSyncSettings } from 'src/modules/field-sync/utils/resolve-field-sync-configs.util';

type FieldMetadataEventBatch = MetadataEventBatch<
  'fieldMetadata',
  'created' | 'updated'
>;

type BackfillRequest = { sourceOptionsBefore?: SyncedFieldOption[] };

const isSameJson = (left: unknown, right: unknown) =>
  JSON.stringify(left ?? null) === JSON.stringify(right ?? null);

@Injectable()
export class FieldSyncMetadataListener {
  constructor(
    private readonly fieldSyncService: FieldSyncService,
    @InjectMessageQueue(MessageQueue.workspaceQueue)
    private readonly messageQueueService: MessageQueueService,
  ) {}

  @OnEvent('metadata.fieldMetadata.created')
  async handleFieldCreated(payload: FieldMetadataEventBatch) {
    for (const event of payload.events) {
      if (!('after' in event.properties)) {
        continue;
      }

      const field = event.properties.after as FlatFieldMetadata;

      if (isDefined(getFieldSyncSettings(field))) {
        await this.enqueueBackfill(payload.workspaceId, field.id, {});
      }
    }
  }

  // Label and icon edits are ignored; only changes that can alter synced values re-run.
  @OnEvent('metadata.fieldMetadata.updated')
  async handleFieldUpdated(payload: FieldMetadataEventBatch) {
    const configs = await this.fieldSyncService.getConfigs(payload.workspaceId);

    const backfillsByTargetFieldId = new Map<string, BackfillRequest>();

    for (const event of payload.events) {
      if (event.type !== 'updated') {
        continue;
      }

      const before = event.properties.before as FlatFieldMetadata;
      const after = event.properties.after as FlatFieldMetadata;

      const wasReactivated = !before.isActive && after.isActive;

      // Jobs right after a rename can still use the old name from the 10s cache memoizer;
      // for a source that reads as empty, so a backfill repairs whatever they wrote.
      const needsCatchUp = wasReactivated || before.name !== after.name;

      if (
        isDefined(getFieldSyncSettings(after)) &&
        (needsCatchUp ||
          !isSameJson(
            getFieldSyncSettings(before),
            getFieldSyncSettings(after),
          ))
      ) {
        backfillsByTargetFieldId.set(after.id, {});
      }

      const haveOptionsChanged = !isSameJson(before.options, after.options);

      for (const config of configs) {
        if (config.sourceFieldId === after.id && haveOptionsChanged) {
          backfillsByTargetFieldId.set(config.targetFieldId, {
            sourceOptionsBefore: before.options as SyncedFieldOption[],
          });
        } else if (
          needsCatchUp &&
          (config.sourceFieldId === after.id ||
            config.relationFieldId === after.id)
        ) {
          backfillsByTargetFieldId.set(config.targetFieldId, {});
        }
      }
    }

    for (const [targetFieldId, request] of backfillsByTargetFieldId) {
      await this.enqueueBackfill(payload.workspaceId, targetFieldId, request);
    }
  }

  private async enqueueBackfill(
    workspaceId: string,
    targetFieldId: string,
    request: BackfillRequest,
  ) {
    await this.messageQueueService.add<FieldSyncJobData>(FieldSyncJob.name, {
      type: 'BACKFILL',
      workspaceId,
      targetFieldId,
      ...request,
    });
  }
}
