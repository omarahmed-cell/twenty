import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Command, CommandRunner } from 'nest-commander';
import { WorkspaceActivationStatus } from 'twenty-shared/workspace';
import { Repository } from 'typeorm';

import { InjectMessageQueue } from 'src/engine/core-modules/message-queue/decorators/message-queue.decorator';
import { Process } from 'src/engine/core-modules/message-queue/decorators/process.decorator';
import { Processor } from 'src/engine/core-modules/message-queue/decorators/processor.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { RoboostMergeLogService } from 'src/modules/roboost-merge/services/roboost-merge-log.service';

// After the 00:37 UTC backup, so a merged record is in at least one backup before it is deleted
export const ROBOOST_MERGE_EXPIRY_CRON_PATTERN = '50 1 * * *';

@Processor(MessageQueue.cronQueue)
export class RoboostMergeExpiryCronJob {
  private readonly logger = new Logger(RoboostMergeExpiryCronJob.name);

  constructor(
    @InjectRepository(WorkspaceEntity)
    private readonly workspaceRepository: Repository<WorkspaceEntity>,
    private readonly roboostMergeLogService: RoboostMergeLogService,
  ) {}

  @Process(RoboostMergeExpiryCronJob.name)
  async handle(): Promise<void> {
    const workspaces = await this.workspaceRepository.find({
      where: { activationStatus: WorkspaceActivationStatus.ACTIVE },
      select: ['id'],
    });

    for (const { id: workspaceId } of workspaces) {
      try {
        const expired =
          await this.roboostMergeLogService.expireOldMerges(workspaceId);

        if (expired > 0) {
          this.logger.log(
            `Workspace ${workspaceId}: ${expired} merge(s) passed the unmerge window; merged records deleted`,
          );
        }
      } catch (error) {
        this.logger.error(
          `Workspace ${workspaceId}: merge expiry failed: ${(error as Error).message}`,
        );
      }
    }
  }
}

@Command({
  name: 'cron:roboost-merge:expiry',
  description:
    'Starts the nightly cron that permanently deletes merged records once their 30-day unmerge window has passed',
})
export class RoboostMergeExpiryCronCommand extends CommandRunner {
  constructor(
    @InjectMessageQueue(MessageQueue.cronQueue)
    private readonly messageQueueService: MessageQueueService,
  ) {
    super();
  }

  async run(): Promise<void> {
    await this.messageQueueService.addCron<undefined>({
      jobName: RoboostMergeExpiryCronJob.name,
      data: undefined,
      options: { repeat: { pattern: ROBOOST_MERGE_EXPIRY_CRON_PATTERN } },
    });
  }
}
