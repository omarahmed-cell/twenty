import { Scope } from '@nestjs/common';

import { InjectMessageQueue } from 'src/engine/core-modules/message-queue/decorators/message-queue.decorator';
import { Process } from 'src/engine/core-modules/message-queue/decorators/process.decorator';
import { Processor } from 'src/engine/core-modules/message-queue/decorators/processor.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';
import { FieldFormulaService } from 'src/modules/field-formula/services/field-formula.service';

// Every process memoizes workspace metadata for 10s, so a record edit just after a metadata
// change can be checked against stale fields and missed. A later backfill repairs it, at no
// cost if nothing changed.
export const FIELD_FORMULA_CATCH_UP_DELAY_MS = 11_000;

export type FieldFormulaJobData = { workspaceId: string } & (
  | { type: 'RECORDS'; objectNameSingular: string; recordIds: string[] }
  | { type: 'BACKFILL'; targetFieldId: string }
  | {
      type: 'RENAME';
      objectMetadataId: string;
      previousName: string;
      nextName: string;
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

    if (data.type === 'RENAME') {
      const targetFieldIds =
        await this.fieldFormulaService.rewriteRenamedReferences(data);

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
