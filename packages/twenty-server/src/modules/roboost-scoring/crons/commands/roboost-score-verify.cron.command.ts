import { Command, CommandRunner } from 'nest-commander';

import { InjectMessageQueue } from 'src/engine/core-modules/message-queue/decorators/message-queue.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';
import {
  ROBOOST_SCORE_VERIFY_CRON_PATTERN,
  RoboostScoreVerifyCronJob,
} from 'src/modules/roboost-scoring/crons/jobs/roboost-score-verify.cron.job';

@Command({
  name: 'cron:roboost-score:verify',
  description:
    'Starts the nightly cron that re-checks every active score, fixes drift and logs the differences',
})
export class RoboostScoreVerifyCronCommand extends CommandRunner {
  constructor(
    @InjectMessageQueue(MessageQueue.cronQueue)
    private readonly messageQueueService: MessageQueueService,
  ) {
    super();
  }

  async run(): Promise<void> {
    await this.messageQueueService.addCron<undefined>({
      jobName: RoboostScoreVerifyCronJob.name,
      data: undefined,
      options: { repeat: { pattern: ROBOOST_SCORE_VERIFY_CRON_PATTERN } },
    });
  }
}
