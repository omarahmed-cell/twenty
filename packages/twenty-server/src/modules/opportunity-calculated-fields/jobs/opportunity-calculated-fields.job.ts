import { Scope } from '@nestjs/common';

import { Process } from 'src/engine/core-modules/message-queue/decorators/process.decorator';
import { Processor } from 'src/engine/core-modules/message-queue/decorators/processor.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { OPPORTUNITY_CALCULATED_FIELDS_JOB_NAME } from 'src/modules/opportunity-calculated-fields/constants/opportunity-calculated-fields-job-name.constant';
import { OpportunityCalculatedFieldsService } from 'src/modules/opportunity-calculated-fields/services/opportunity-calculated-fields.service';
import { OpportunityCalculationQueueService } from 'src/modules/opportunity-calculated-fields/services/opportunity-calculation-queue.service';

export type OpportunityCalculatedFieldsJobData = {
  workspaceId: string;
  isFullRecompute?: boolean;
};

@Processor({ queueName: MessageQueue.workspaceQueue, scope: Scope.REQUEST })
export class OpportunityCalculatedFieldsJob {
  constructor(
    private readonly opportunityCalculatedFieldsService: OpportunityCalculatedFieldsService,
    private readonly opportunityCalculationQueueService: OpportunityCalculationQueueService,
  ) {}

  @Process(OPPORTUNITY_CALCULATED_FIELDS_JOB_NAME)
  async handle({
    workspaceId,
    isFullRecompute = false,
  }: OpportunityCalculatedFieldsJobData): Promise<void> {
    if (isFullRecompute) {
      await this.opportunityCalculatedFieldsService.recomputeAllOpportunities(
        workspaceId,
      );

      return;
    }

    const references =
      await this.opportunityCalculationQueueService.popReferences(workspaceId);

    if (references.length === 0) {
      return;
    }

    const opportunityIds =
      await this.opportunityCalculatedFieldsService.resolveOpportunityIds({
        workspaceId,
        references,
      });

    await this.opportunityCalculatedFieldsService.recomputeOpportunities({
      workspaceId,
      opportunityIds,
    });
  }
}
