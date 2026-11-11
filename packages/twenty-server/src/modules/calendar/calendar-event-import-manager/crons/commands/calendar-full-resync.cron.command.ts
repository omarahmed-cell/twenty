import { Command, CommandRunner } from 'nest-commander';

import { InjectMessageQueue } from 'src/engine/core-modules/message-queue/decorators/message-queue.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';
import {
  CALENDAR_FULL_RESYNC_CRON_PATTERN,
  CalendarFullResyncCronJob,
} from 'src/modules/calendar/calendar-event-import-manager/crons/jobs/calendar-full-resync.cron.job';

@Command({
  name: 'cron:calendar:full-resync',
  description:
    'Starts a weekly cron job that resets Google calendar sync cursors so events entering the import horizon get imported',
})
export class CalendarFullResyncCronCommand extends CommandRunner {
  constructor(
    @InjectMessageQueue(MessageQueue.cronQueue)
    private readonly messageQueueService: MessageQueueService,
  ) {
    super();
  }

  async run(): Promise<void> {
    await this.messageQueueService.addCron<undefined>({
      jobName: CalendarFullResyncCronJob.name,
      data: undefined,
      options: {
        repeat: { pattern: CALENDAR_FULL_RESYNC_CRON_PATTERN },
      },
    });
  }
}
