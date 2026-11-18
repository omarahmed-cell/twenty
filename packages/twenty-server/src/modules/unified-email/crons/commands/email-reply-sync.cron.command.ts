import { Command, CommandRunner } from 'nest-commander';

import { InjectMessageQueue } from 'src/engine/core-modules/message-queue/decorators/message-queue.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';
import {
  EMAIL_REPLY_SYNC_CRON_PATTERN,
  EmailReplySyncCronJob,
} from 'src/modules/unified-email/crons/jobs/email-reply-sync.cron.job';

@Command({
  name: 'cron:email-reply-sync',
  description:
    'Starts the cron that reads new messages in logged Gmail threads every 5 minutes',
})
export class EmailReplySyncCronCommand extends CommandRunner {
  constructor(
    @InjectMessageQueue(MessageQueue.cronQueue)
    private readonly messageQueueService: MessageQueueService,
  ) {
    super();
  }

  async run(): Promise<void> {
    await this.messageQueueService.addCron<undefined>({
      jobName: EmailReplySyncCronJob.name,
      data: undefined,
      options: {
        repeat: { pattern: EMAIL_REPLY_SYNC_CRON_PATTERN },
      },
    });
  }
}
