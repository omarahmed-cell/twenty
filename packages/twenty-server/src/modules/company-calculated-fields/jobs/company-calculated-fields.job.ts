import { Scope } from '@nestjs/common';

import { Process } from 'src/engine/core-modules/message-queue/decorators/process.decorator';
import { Processor } from 'src/engine/core-modules/message-queue/decorators/processor.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { CompanyCalculatedFieldsService } from 'src/modules/company-calculated-fields/services/company-calculated-fields.service';
import { CompanyCalculationQueueService } from 'src/modules/company-calculated-fields/services/company-calculation-queue.service';

export type CompanyCalculatedFieldsJobData = {
  workspaceId: string;
  isFullRecompute?: boolean;
};

@Processor({ queueName: MessageQueue.workspaceQueue, scope: Scope.REQUEST })
export class CompanyCalculatedFieldsJob {
  constructor(
    private readonly companyCalculatedFieldsService: CompanyCalculatedFieldsService,
    private readonly companyCalculationQueueService: CompanyCalculationQueueService,
  ) {}

  @Process(CompanyCalculatedFieldsJob.name)
  async handle({
    workspaceId,
    isFullRecompute = false,
  }: CompanyCalculatedFieldsJobData): Promise<void> {
    if (isFullRecompute) {
      await this.companyCalculatedFieldsService.recomputeAllCompanies(
        workspaceId,
      );

      return;
    }

    const references =
      await this.companyCalculationQueueService.popReferences(workspaceId);

    if (references.length === 0) {
      return;
    }

    const companyIds =
      await this.companyCalculatedFieldsService.resolveCompanyIds({
        workspaceId,
        references,
      });

    await this.companyCalculatedFieldsService.recomputeCompanies({
      workspaceId,
      companyIds,
    });
  }
}
