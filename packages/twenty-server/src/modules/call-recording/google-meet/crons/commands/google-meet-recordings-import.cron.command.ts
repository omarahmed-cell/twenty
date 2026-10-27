import { Command, CommandRunner } from 'nest-commander';

import { InjectMessageQueue } from 'src/engine/core-modules/message-queue/decorators/message-queue.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';
import {
  GOOGLE_MEET_RECORDINGS_IMPORT_CRON_PATTERN,
  GoogleMeetRecordingsImportCronJob,
} from 'src/modules/call-recording/google-meet/crons/jobs/google-meet-recordings-import.cron.job';

@Command({
  name: 'cron:calendar:google-meet-recordings-import',
  description:
    'Starts a cron job importing Google Meet recordings, transcripts and Gemini notes',
})
export class GoogleMeetRecordingsImportCronCommand extends CommandRunner {
  constructor(
    @InjectMessageQueue(MessageQueue.cronQueue)
    private readonly messageQueueService: MessageQueueService,
  ) {
    super();
  }

  async run(): Promise<void> {
    await this.messageQueueService.addCron<undefined>({
      jobName: GoogleMeetRecordingsImportCronJob.name,
      data: undefined,
      options: {
        repeat: { pattern: GOOGLE_MEET_RECORDINGS_IMPORT_CRON_PATTERN },
      },
    });
  }
}
