import { Command, CommandRunner } from 'nest-commander';

import { InjectMessageQueue } from 'src/engine/core-modules/message-queue/decorators/message-queue.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';
import {
  COMPANY_CALCULATED_FIELDS_NIGHTLY_CRON_PATTERN,
  CompanyCalculatedFieldsNightlyCronJob,
} from 'src/modules/company-calculated-fields/crons/jobs/company-calculated-fields-nightly.cron.job';

@Command({
  name: 'cron:company-calculated-fields:nightly',
  description:
    'Starts the nightly cron that fully recomputes every company calculated field',
})
export class CompanyCalculatedFieldsNightlyCronCommand extends CommandRunner {
  constructor(
    @InjectMessageQueue(MessageQueue.cronQueue)
    private readonly messageQueueService: MessageQueueService,
  ) {
    super();
  }

  async run(): Promise<void> {
    await this.messageQueueService.addCron<undefined>({
      jobName: CompanyCalculatedFieldsNightlyCronJob.name,
      data: undefined,
      options: {
        repeat: { pattern: COMPANY_CALCULATED_FIELDS_NIGHTLY_CRON_PATTERN },
      },
    });
  }
}
