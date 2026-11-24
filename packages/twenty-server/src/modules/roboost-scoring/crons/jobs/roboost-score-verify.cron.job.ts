import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { WorkspaceActivationStatus } from 'twenty-shared/workspace';
import { Repository } from 'typeorm';

import { InjectMessageQueue } from 'src/engine/core-modules/message-queue/decorators/message-queue.decorator';
import { Process } from 'src/engine/core-modules/message-queue/decorators/process.decorator';
import { Processor } from 'src/engine/core-modules/message-queue/decorators/processor.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import {
  RoboostScoreRecalcJob,
  type RoboostScoreRecalcJobData,
} from 'src/modules/roboost-scoring/jobs/roboost-score-recalc.job';
import { RoboostScoreStoreService } from 'src/modules/roboost-scoring/services/roboost-score-store.service';

// After the 00:37 UTC backup, before the 01:15 history trim
export const ROBOOST_SCORE_VERIFY_CRON_PATTERN = '50 0 * * *';

@Processor(MessageQueue.cronQueue)
export class RoboostScoreVerifyCronJob {
  private readonly logger = new Logger(RoboostScoreVerifyCronJob.name);

  constructor(
    @InjectRepository(WorkspaceEntity)
    private readonly workspaceRepository: Repository<WorkspaceEntity>,
    private readonly roboostScoreStoreService: RoboostScoreStoreService,
    @InjectMessageQueue(MessageQueue.workspaceQueue)
    private readonly messageQueueService: MessageQueueService,
  ) {}

  @Process(RoboostScoreVerifyCronJob.name)
  async handle(): Promise<void> {
    const workspaces = await this.workspaceRepository.find({
      where: { activationStatus: WorkspaceActivationStatus.ACTIVE },
      select: ['id'],
    });

    for (const { id: workspaceId } of workspaces) {
      try {
        if (!(await this.roboostScoreStoreService.tablesExist(workspaceId))) {
          continue;
        }
        for (const {
          score,
        } of await this.roboostScoreStoreService.findLiveScores(workspaceId)) {
          await this.messageQueueService.add<RoboostScoreRecalcJobData>(
            RoboostScoreRecalcJob.name,
            { workspaceId, scoreId: score.id, mode: 'verify' },
          );
        }
      } catch (error) {
        this.logger.error(
          `Could not queue the nightly score check for workspace ${workspaceId}: ${error}`,
        );
      }
    }
  }
}
