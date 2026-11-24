import { Command, CommandRunner } from 'nest-commander';

import { InjectMessageQueue } from 'src/engine/core-modules/message-queue/decorators/message-queue.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';
import {
  PROPERTY_HISTORY_TRIM_CRON_PATTERN,
  PropertyHistoryTrimCronJob,
} from 'src/modules/timeline/crons/jobs/property-history-trim.cron.job';

@Command({
  name: 'cron:property-history:trim',
  description:
    'Starts the nightly cron that keeps only the latest changes per record and property',
})
export class PropertyHistoryTrimCronCommand extends CommandRunner {
  constructor(
    @InjectMessageQueue(MessageQueue.cronQueue)
    private readonly messageQueueService: MessageQueueService,
  ) {
    super();
  }

  async run(): Promise<void> {
    await this.messageQueueService.addCron<undefined>({
      jobName: PropertyHistoryTrimCronJob.name,
      data: undefined,
      options: {
        repeat: { pattern: PROPERTY_HISTORY_TRIM_CRON_PATTERN },
      },
    });
  }
}
