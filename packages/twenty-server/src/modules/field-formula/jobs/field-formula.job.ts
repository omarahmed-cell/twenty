import { Scope } from '@nestjs/common';

import { Process } from 'src/engine/core-modules/message-queue/decorators/process.decorator';
import { Processor } from 'src/engine/core-modules/message-queue/decorators/processor.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { FieldFormulaService } from 'src/modules/field-formula/services/field-formula.service';

export type FieldFormulaJobData = { workspaceId: string } & (
  | { type: 'RECORDS'; objectNameSingular: string; recordIds: string[] }
  | { type: 'BACKFILL'; targetFieldId: string }
);

@Processor({ queueName: MessageQueue.workspaceQueue, scope: Scope.REQUEST })
export class FieldFormulaJob {
  constructor(private readonly fieldFormulaService: FieldFormulaService) {}

  @Process(FieldFormulaJob.name)
  async handle(data: FieldFormulaJobData): Promise<void> {
    if (data.type === 'RECORDS') {
      await this.fieldFormulaService.recomputeRecords(data);

      return;
    }

    await this.fieldFormulaService.backfill(data);
  }
}
