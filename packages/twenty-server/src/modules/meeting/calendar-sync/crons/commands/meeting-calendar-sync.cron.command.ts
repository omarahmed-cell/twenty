import { Command, CommandRunner } from 'nest-commander';

import { InjectMessageQueue } from 'src/engine/core-modules/message-queue/decorators/message-queue.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';
import {
  MEETING_CALENDAR_SYNC_CRON_PATTERN,
  MeetingCalendarSyncCronJob,
} from 'src/modules/meeting/calendar-sync/crons/jobs/meeting-calendar-sync.cron.job';

@Command({
  name: 'cron:meeting-calendar-sync',
  description:
    "Starts the cron that turns reps' Google Calendar events with CRM contacts into Meetings every 5 minutes",
})
export class MeetingCalendarSyncCronCommand extends CommandRunner {
  constructor(
    @InjectMessageQueue(MessageQueue.cronQueue)
    private readonly messageQueueService: MessageQueueService,
  ) {
    super();
  }

  async run(): Promise<void> {
    await this.messageQueueService.addCron<undefined>({
      jobName: MeetingCalendarSyncCronJob.name,
      data: undefined,
      options: {
        repeat: { pattern: MEETING_CALENDAR_SYNC_CRON_PATTERN },
      },
    });
  }
}
