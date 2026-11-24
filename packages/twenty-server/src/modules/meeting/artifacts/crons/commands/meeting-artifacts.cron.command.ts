import { Command, CommandRunner } from 'nest-commander';

import { InjectMessageQueue } from 'src/engine/core-modules/message-queue/decorators/message-queue.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';
import {
  MEETING_ARTIFACTS_CRON_PATTERN,
  MeetingArtifactsCronJob,
} from 'src/modules/meeting/artifacts/crons/jobs/meeting-artifacts.cron.job';

@Command({
  name: 'cron:meeting-artifacts',
  description:
    'Starts the cron that reads Google Meet recordings, transcripts and Gemini notes every 15 minutes',
})
export class MeetingArtifactsCronCommand extends CommandRunner {
  constructor(
    @InjectMessageQueue(MessageQueue.cronQueue)
    private readonly messageQueueService: MessageQueueService,
  ) {
    super();
  }

  async run(): Promise<void> {
    await this.messageQueueService.addCron<undefined>({
      jobName: MeetingArtifactsCronJob.name,
      data: undefined,
      options: {
        repeat: { pattern: MEETING_ARTIFACTS_CRON_PATTERN },
      },
    });
  }
}
