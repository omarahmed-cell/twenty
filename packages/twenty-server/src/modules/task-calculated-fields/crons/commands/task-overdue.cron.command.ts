import { Command, CommandRunner } from 'nest-commander';

import { InjectMessageQueue } from 'src/engine/core-modules/message-queue/decorators/message-queue.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';
import {
  TASK_OVERDUE_CRON_PATTERN,
  TaskOverdueCronJob,
} from 'src/modules/task-calculated-fields/crons/jobs/task-overdue.cron.job';

@Command({
  name: 'cron:task-overdue',
  description:
    'Starts the cron that updates Is Overdue on tasks every 15 minutes',
})
export class TaskOverdueCronCommand extends CommandRunner {
  constructor(
    @InjectMessageQueue(MessageQueue.cronQueue)
    private readonly messageQueueService: MessageQueueService,
  ) {
    super();
  }

  async run(): Promise<void> {
    await this.messageQueueService.addCron<undefined>({
      jobName: TaskOverdueCronJob.name,
      data: undefined,
      options: {
        repeat: { pattern: TASK_OVERDUE_CRON_PATTERN },
      },
    });
  }
}
