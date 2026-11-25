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
import { RoboostDuplicateService } from 'src/modules/roboost-merge/services/roboost-duplicate.service';

// After the 00:37 UTC backup
export const ROBOOST_DUPLICATE_SCAN_CRON_PATTERN = '45 0 * * *';

@Processor(MessageQueue.cronQueue)
export class RoboostDuplicateScanCronJob {
  private readonly logger = new Logger(RoboostDuplicateScanCronJob.name);

  constructor(
    @InjectRepository(WorkspaceEntity)
    private readonly workspaceRepository: Repository<WorkspaceEntity>,
    private readonly roboostDuplicateService: RoboostDuplicateService,
  ) {}

  @Process(RoboostDuplicateScanCronJob.name)
  async handle(): Promise<void> {
    const workspaces = await this.workspaceRepository.find({
      where: { activationStatus: WorkspaceActivationStatus.ACTIVE },
      select: ['id'],
    });

    for (const { id: workspaceId } of workspaces) {
      try {
        if (!(await this.roboostDuplicateService.tablesExist(workspaceId))) {
          continue;
        }

        const counts = await this.roboostDuplicateService.scanAll(workspaceId);

        this.logger.log(
          `Workspace ${workspaceId}: duplicate scan ${JSON.stringify(counts)}`,
        );
      } catch (error) {
        this.logger.error(
          `Workspace ${workspaceId}: duplicate scan failed: ${(error as Error).message}`,
        );
      }
    }
  }
}

@Command({
  name: 'cron:roboost-duplicate:scan',
  description:
    'Starts the nightly duplicate scan for companies, contacts, deals and services',
})
export class RoboostDuplicateScanCronCommand extends CommandRunner {
  constructor(
    @InjectMessageQueue(MessageQueue.cronQueue)
    private readonly messageQueueService: MessageQueueService,
  ) {
    super();
  }

  async run(): Promise<void> {
    await this.messageQueueService.addCron<undefined>({
      jobName: RoboostDuplicateScanCronJob.name,
      data: undefined,
      options: { repeat: { pattern: ROBOOST_DUPLICATE_SCAN_CRON_PATTERN } },
    });
  }
}
