import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { WorkspaceActivationStatus } from 'twenty-shared/workspace';
import { Repository } from 'typeorm';

import { Process } from 'src/engine/core-modules/message-queue/decorators/process.decorator';
import { Processor } from 'src/engine/core-modules/message-queue/decorators/processor.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { RoboostTaskNotificationService } from 'src/modules/roboost-notification/services/roboost-task-notification.service';
import { TaskOverdueService } from 'src/modules/task-calculated-fields/services/task-overdue.service';

export const TASK_OVERDUE_CRON_PATTERN = '*/5 * * * *';

// A due date passing changes Is Overdue without any record write
@Processor(MessageQueue.cronQueue)
export class TaskOverdueCronJob {
  private readonly logger = new Logger(TaskOverdueCronJob.name);

  constructor(
    @InjectRepository(WorkspaceEntity)
    private readonly workspaceRepository: Repository<WorkspaceEntity>,
    private readonly taskOverdueService: TaskOverdueService,
    private readonly roboostTaskNotificationService: RoboostTaskNotificationService,
  ) {}

  @Process(TaskOverdueCronJob.name)
  async handle(): Promise<void> {
    const workspaces = await this.workspaceRepository.find({
      where: { activationStatus: WorkspaceActivationStatus.ACTIVE },
      select: ['id'],
    });

    for (const { id: workspaceId } of workspaces) {
      try {
        const newlyOverdue =
          await this.taskOverdueService.recomputeOverdue(workspaceId);

        await this.roboostTaskNotificationService.notifyNewlyOverdue(
          workspaceId,
          newlyOverdue,
        );
      } catch (error) {
        this.logger.error(
          `Could not recompute overdue tasks for workspace ${workspaceId}: ${error}`,
        );
      }
    }
  }
}
