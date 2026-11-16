import { Scope } from '@nestjs/common';

import { Process } from 'src/engine/core-modules/message-queue/decorators/process.decorator';
import { Processor } from 'src/engine/core-modules/message-queue/decorators/processor.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { PIPELINE_SYNC_JOB_NAME } from 'src/modules/pipeline/constants/pipeline-job-names.constant';
import { PipelineSyncService } from 'src/modules/pipeline/services/pipeline-sync.service';

export type PipelineSyncJobData = { workspaceId: string };

@Processor({ queueName: MessageQueue.workspaceQueue, scope: Scope.REQUEST })
export class PipelineSyncJob {
  constructor(private readonly pipelineSyncService: PipelineSyncService) {}

  @Process(PIPELINE_SYNC_JOB_NAME)
  async handle({ workspaceId }: PipelineSyncJobData): Promise<void> {
    await this.pipelineSyncService.syncOpportunitySelectFields(workspaceId);
  }
}
