import { Scope } from '@nestjs/common';

import { Process } from 'src/engine/core-modules/message-queue/decorators/process.decorator';
import { Processor } from 'src/engine/core-modules/message-queue/decorators/processor.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { FieldSyncService } from 'src/modules/field-sync/services/field-sync.service';
import { type SyncedFieldOption } from 'src/modules/field-sync/utils/build-synced-field-options.util';

export type FieldSyncJobTask =
  | { type: 'TARGETS'; targetRecordIds: string[] }
  | { type: 'SOURCES'; sourceRecordIds: string[] }
  | { type: 'ORPHANS' }
  | { type: 'BACKFILL'; sourceOptionsBefore?: SyncedFieldOption[] };

export type FieldSyncJobData = {
  workspaceId: string;
  targetFieldId: string;
} & FieldSyncJobTask;

@Processor({ queueName: MessageQueue.workspaceQueue, scope: Scope.REQUEST })
export class FieldSyncJob {
  constructor(private readonly fieldSyncService: FieldSyncService) {}

  @Process(FieldSyncJob.name)
  async handle(data: FieldSyncJobData): Promise<void> {
    const { workspaceId, targetFieldId } = data;

    switch (data.type) {
      case 'TARGETS':
        await this.fieldSyncService.syncTargetRecords({
          workspaceId,
          targetFieldId,
          targetRecordIds: data.targetRecordIds,
        });

        return;
      case 'SOURCES':
        await this.fieldSyncService.syncTargetRecordsBySources({
          workspaceId,
          targetFieldId,
          sourceRecordIds: data.sourceRecordIds,
        });

        return;
      case 'ORPHANS':
        await this.fieldSyncService.clearOrphanedTargets({
          workspaceId,
          targetFieldId,
        });

        return;
      case 'BACKFILL':
        await this.fieldSyncService.backfill({
          workspaceId,
          targetFieldId,
          sourceOptionsBefore: data.sourceOptionsBefore,
        });

        return;
    }
  }
}
