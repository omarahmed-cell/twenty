import { Command, CommandRunner } from 'nest-commander';

import { InjectMessageQueue } from 'src/engine/core-modules/message-queue/decorators/message-queue.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';
import {
  OPPORTUNITY_CALCULATED_FIELDS_NIGHTLY_CRON_PATTERN,
  OpportunityCalculatedFieldsNightlyCronJob,
} from 'src/modules/opportunity-calculated-fields/crons/jobs/opportunity-calculated-fields-nightly.cron.job';

@Command({
  name: 'cron:opportunity-calculated-fields:nightly',
  description:
    'Starts the nightly cron that fully recomputes every deal calculated field',
})
export class OpportunityCalculatedFieldsNightlyCronCommand extends CommandRunner {
  constructor(
    @InjectMessageQueue(MessageQueue.cronQueue)
    private readonly messageQueueService: MessageQueueService,
  ) {
    super();
  }

  async run(): Promise<void> {
    await this.messageQueueService.addCron<undefined>({
      jobName: OpportunityCalculatedFieldsNightlyCronJob.name,
      data: undefined,
      options: {
        repeat: { pattern: OPPORTUNITY_CALCULATED_FIELDS_NIGHTLY_CRON_PATTERN },
      },
    });
  }
}
