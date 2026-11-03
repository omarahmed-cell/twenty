import { Scope } from '@nestjs/common';

import { InjectMessageQueue } from 'src/engine/core-modules/message-queue/decorators/message-queue.decorator';
import { Process } from 'src/engine/core-modules/message-queue/decorators/process.decorator';
import { Processor } from 'src/engine/core-modules/message-queue/decorators/processor.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';
import { FieldFormulaService } from 'src/modules/field-formula/services/field-formula.service';
import {
  FieldSyncJob,
  type FieldSyncJobData,
} from 'src/modules/field-sync/jobs/field-sync.job';

// Every process memoizes workspace metadata for 10s, so a record edit just after a metadata
// change can be checked against stale fields and missed. A later backfill repairs it, at no
// cost if nothing changed.
export const FIELD_FORMULA_CATCH_UP_DELAY_MS = 11_000;

export type FieldFormulaJobData = { workspaceId: string } & (
  | { type: 'RECORDS'; objectNameSingular: string; recordIds: string[] }
  | { type: 'BACKFILL'; targetFieldId: string }
  | { type: 'TIME_BASED' }
  | {
      type: 'REWRITE_REFERENCES';
      objectMetadataId: string;
      fieldId: string;
      previousName: string;
      nextName: string;
      optionValueRenames: { from: string; to: string }[];
    }
);

@Processor({ queueName: MessageQueue.workspaceQueue, scope: Scope.REQUEST })
export class FieldFormulaJob {
  constructor(
    private readonly fieldFormulaService: FieldFormulaService,
    @InjectMessageQueue(MessageQueue.workspaceQueue)
    private readonly messageQueueService: MessageQueueService,
  ) {}

  @Process(FieldFormulaJob.name)
  async handle(data: FieldFormulaJobData): Promise<void> {
    if (data.type === 'RECORDS') {
      await this.fieldFormulaService.recomputeRecords(data);

      return;
    }

    if (data.type === 'TIME_BASED') {
      const changedFieldIds =
        await this.fieldFormulaService.recomputeTimeBased(data);

      const syncTargetFieldIds =
        await this.fieldFormulaService.getSyncTargetFieldIdsReading(
          data.workspaceId,
          changedFieldIds,
        );

      for (const targetFieldId of syncTargetFieldIds) {
        await this.messageQueueService.add<FieldSyncJobData>(FieldSyncJob.name, {
          type: 'BACKFILL',
          workspaceId: data.workspaceId,
          targetFieldId,
        });
      }

      return;
    }

    if (data.type === 'REWRITE_REFERENCES') {
      const targetFieldIds =
        await this.fieldFormulaService.rewriteReferences(data);

      for (const targetFieldId of targetFieldIds) {
        await this.messageQueueService.add<FieldFormulaJobData>(
          FieldFormulaJob.name,
          {
            type: 'BACKFILL',
            workspaceId: data.workspaceId,
            targetFieldId,
          },
          { delay: FIELD_FORMULA_CATCH_UP_DELAY_MS },
        );
      }

      return;
    }

    await this.fieldFormulaService.backfill(data);
  }
}
