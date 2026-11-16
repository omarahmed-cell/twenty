import { Scope } from '@nestjs/common';

import { Process } from 'src/engine/core-modules/message-queue/decorators/process.decorator';
import { Processor } from 'src/engine/core-modules/message-queue/decorators/processor.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { WorkspaceOrmManager } from 'src/engine/twenty-orm/workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
import { OpportunityCalculationQueueService } from 'src/modules/opportunity-calculated-fields/services/opportunity-calculation-queue.service';
import { DEAL_CLOSE_DATE_JOB_NAME } from 'src/modules/pipeline/constants/pipeline-job-names.constant';

export type DealCloseDateJobData = {
  workspaceId: string;
  updates: { recordId: string; closeDate: string | null }[];
};

@Processor({ queueName: MessageQueue.workspaceQueue, scope: Scope.REQUEST })
export class DealCloseDateJob {
  constructor(
    private readonly workspaceOrmManager: WorkspaceOrmManager,
    private readonly opportunityCalculationQueueService: OpportunityCalculationQueueService,
  ) {}

  @Process(DEAL_CLOSE_DATE_JOB_NAME)
  async handle({ workspaceId, updates }: DealCloseDateJobData): Promise<void> {
    await this.workspaceOrmManager.executeInWorkspaceContext(async () => {
      // The stage move already has its own timeline entry
      const repository = this.workspaceOrmManager.getRepository(
        'opportunity',
        { shouldBypassPermissionChecks: true },
        { shouldSkipEventEmission: true },
      );

      for (const { recordId, closeDate } of updates) {
        await repository.update({ id: recordId }, { closeDate });
      }
    }, buildSystemAuthContext(workspaceId));

    // The write above emits no event, and Actual duration reads Close Date
    await this.opportunityCalculationQueueService.enqueueReferences({
      workspaceId,
      references: updates.map(({ recordId }) => `opportunity:${recordId}`),
    });
  }
}
