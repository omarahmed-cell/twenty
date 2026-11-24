import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { WorkspaceActivationStatus } from 'twenty-shared/workspace';
import { Repository } from 'typeorm';

import { Process } from 'src/engine/core-modules/message-queue/decorators/process.decorator';
import { Processor } from 'src/engine/core-modules/message-queue/decorators/processor.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { RoboostTaskNotificationService } from 'src/modules/roboost-notification/services/roboost-task-notification.service';

export const ROBOOST_TASK_REMINDER_CRON_PATTERN = '* * * * *';
export const ROBOOST_OVERDUE_DIGEST_CRON_PATTERN = '*/15 * * * *';

// Reminders fire on the minute; the digest checks each member's work-day start every 15 minutes
@Processor(MessageQueue.cronQueue)
export class RoboostTaskReminderCronJob {
  private readonly logger = new Logger(RoboostTaskReminderCronJob.name);

  constructor(
    @InjectRepository(WorkspaceEntity)
    private readonly workspaceRepository: Repository<WorkspaceEntity>,
    private readonly roboostTaskNotificationService: RoboostTaskNotificationService,
  ) {}

  private async forEachWorkspace(
    run: (workspaceId: string) => Promise<unknown>,
  ) {
    const workspaces = await this.workspaceRepository.find({
      where: { activationStatus: WorkspaceActivationStatus.ACTIVE },
      select: ['id'],
    });

    for (const { id: workspaceId } of workspaces) {
      try {
        await run(workspaceId);
      } catch (error) {
        this.logger.error(
          `Task notifications failed for workspace ${workspaceId}: ${error}`,
        );
      }
    }
  }

  @Process(RoboostTaskReminderCronJob.name)
  async handle(): Promise<void> {
    await this.forEachWorkspace((workspaceId) =>
      this.roboostTaskNotificationService.sendDueReminders(workspaceId),
    );
  }

  @Process(`${RoboostTaskReminderCronJob.name}Digest`)
  async handleDigest(): Promise<void> {
    await this.forEachWorkspace((workspaceId) =>
      this.roboostTaskNotificationService.sendOverdueDigests(workspaceId),
    );
  }
}
