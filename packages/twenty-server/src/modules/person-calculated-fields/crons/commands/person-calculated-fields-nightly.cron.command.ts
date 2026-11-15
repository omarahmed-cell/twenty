import { Command, CommandRunner } from 'nest-commander';

import { InjectMessageQueue } from 'src/engine/core-modules/message-queue/decorators/message-queue.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';
import {
  PERSON_CALCULATED_FIELDS_NIGHTLY_CRON_PATTERN,
  PersonCalculatedFieldsNightlyCronJob,
} from 'src/modules/person-calculated-fields/crons/jobs/person-calculated-fields-nightly.cron.job';

@Command({
  name: 'cron:person-calculated-fields:nightly',
  description:
    'Starts the nightly cron that fully recomputes every person calculated field',
})
export class PersonCalculatedFieldsNightlyCronCommand extends CommandRunner {
  constructor(
    @InjectMessageQueue(MessageQueue.cronQueue)
    private readonly messageQueueService: MessageQueueService,
  ) {
    super();
  }

  async run(): Promise<void> {
    await this.messageQueueService.addCron<undefined>({
      jobName: PersonCalculatedFieldsNightlyCronJob.name,
      data: undefined,
      options: {
        repeat: { pattern: PERSON_CALCULATED_FIELDS_NIGHTLY_CRON_PATTERN },
      },
    });
  }
}
