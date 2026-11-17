import { Scope } from '@nestjs/common';

import { type PipelineObjectNameSingular } from 'twenty-shared/utils';

import { Process } from 'src/engine/core-modules/message-queue/decorators/process.decorator';
import { Processor } from 'src/engine/core-modules/message-queue/decorators/processor.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { DEAL_STAGE_HISTORY_JOB_NAME } from 'src/modules/deal-stage-history/constants/deal-stage-history-job-name.constant';
import {
  type DealStageChange,
  DealStageHistoryService,
} from 'src/modules/deal-stage-history/services/deal-stage-history.service';

// Jobs queued before services existed carry no object and are deals
export type DealStageHistoryJobData = {
  workspaceId: string;
  changes: DealStageChange[];
  objectNameSingular?: PipelineObjectNameSingular;
};

@Processor({ queueName: MessageQueue.workspaceQueue, scope: Scope.REQUEST })
export class DealStageHistoryJob {
  constructor(
    private readonly dealStageHistoryService: DealStageHistoryService,
  ) {}

  @Process(DEAL_STAGE_HISTORY_JOB_NAME)
  async handle({
    workspaceId,
    changes,
    objectNameSingular,
  }: DealStageHistoryJobData): Promise<void> {
    await this.dealStageHistoryService.recordStageChanges({
      workspaceId,
      changes,
      objectNameSingular,
    });
  }
}
