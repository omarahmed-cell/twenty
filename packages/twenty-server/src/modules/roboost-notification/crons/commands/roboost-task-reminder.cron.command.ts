import { Command, CommandRunner } from 'nest-commander';

import { InjectMessageQueue } from 'src/engine/core-modules/message-queue/decorators/message-queue.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';
import {
  ROBOOST_OVERDUE_DIGEST_CRON_PATTERN,
  ROBOOST_TASK_REMINDER_CRON_PATTERN,
  RoboostTaskReminderCronJob,
} from 'src/modules/roboost-notification/crons/jobs/roboost-task-reminder.cron.job';

@Command({
  name: 'cron:roboost-notification:task-reminders',
  description:
    'Starts the crons that send task reminders every minute and the overdue digest at the start of each work day',
})
export class RoboostTaskReminderCronCommand extends CommandRunner {
  constructor(
    @InjectMessageQueue(MessageQueue.cronQueue)
    private readonly messageQueueService: MessageQueueService,
  ) {
    super();
  }

  async run(): Promise<void> {
    await this.messageQueueService.addCron<undefined>({
      jobName: RoboostTaskReminderCronJob.name,
      data: undefined,
      options: { repeat: { pattern: ROBOOST_TASK_REMINDER_CRON_PATTERN } },
    });
    await this.messageQueueService.addCron<undefined>({
      jobName: `${RoboostTaskReminderCronJob.name}Digest`,
      data: undefined,
      options: { repeat: { pattern: ROBOOST_OVERDUE_DIGEST_CRON_PATTERN } },
    });
  }
}
