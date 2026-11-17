import { Scope } from '@nestjs/common';

import {
  PIPELINE_OBJECT_NAMES,
  type PipelineObjectNameSingular,
} from 'twenty-shared/utils';

import { Process } from 'src/engine/core-modules/message-queue/decorators/process.decorator';
import { Processor } from 'src/engine/core-modules/message-queue/decorators/processor.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { PIPELINE_SYNC_JOB_NAME } from 'src/modules/pipeline/constants/pipeline-job-names.constant';
import { PipelineSyncService } from 'src/modules/pipeline/services/pipeline-sync.service';

// Without an object (a stage write, or a job queued before services existed) every pipeline object syncs
export type PipelineSyncJobData = {
  workspaceId: string;
  objectNameSingular?: PipelineObjectNameSingular;
};

@Processor({ queueName: MessageQueue.workspaceQueue, scope: Scope.REQUEST })
export class PipelineSyncJob {
  constructor(private readonly pipelineSyncService: PipelineSyncService) {}

  @Process(PIPELINE_SYNC_JOB_NAME)
  async handle({
    workspaceId,
    objectNameSingular,
  }: PipelineSyncJobData): Promise<void> {
    for (const pipelineObjectNameSingular of objectNameSingular !== undefined
      ? [objectNameSingular]
      : PIPELINE_OBJECT_NAMES) {
      await this.pipelineSyncService.syncSelectFields(
        workspaceId,
        pipelineObjectNameSingular,
      );
    }
  }
}
