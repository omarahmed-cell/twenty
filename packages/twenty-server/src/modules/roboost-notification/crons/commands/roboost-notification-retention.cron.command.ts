import { Command, CommandRunner } from 'nest-commander';

import { InjectMessageQueue } from 'src/engine/core-modules/message-queue/decorators/message-queue.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';
import {
  ROBOOST_NOTIFICATION_RETENTION_CRON_PATTERN,
  RoboostNotificationRetentionCronJob,
} from 'src/modules/roboost-notification/crons/jobs/roboost-notification-retention.cron.job';

@Command({
  name: 'cron:roboost-notification:retention',
  description:
    'Starts the nightly cron that empties notification trash after 30 days and drops read notifications after 90',
})
export class RoboostNotificationRetentionCronCommand extends CommandRunner {
  constructor(
    @InjectMessageQueue(MessageQueue.cronQueue)
    private readonly messageQueueService: MessageQueueService,
  ) {
    super();
  }

  async run(): Promise<void> {
    await this.messageQueueService.addCron<undefined>({
      jobName: RoboostNotificationRetentionCronJob.name,
      data: undefined,
      options: {
        repeat: { pattern: ROBOOST_NOTIFICATION_RETENTION_CRON_PATTERN },
      },
    });
  }
}
