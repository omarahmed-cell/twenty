import { Command, CommandRunner } from 'nest-commander';

import { InjectMessageQueue } from 'src/engine/core-modules/message-queue/decorators/message-queue.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';
import {
  FIELD_FORMULA_TIME_BASED_CRON_PATTERN,
  FieldFormulaTimeBasedCronJob,
} from 'src/modules/field-formula/crons/jobs/field-formula-time-based.cron.job';

@Command({
  name: 'cron:field-formula:time-based',
  description: 'Starts a cron job to recalculate time-based Calculation fields',
})
export class FieldFormulaTimeBasedCronCommand extends CommandRunner {
  constructor(
    @InjectMessageQueue(MessageQueue.cronQueue)
    private readonly messageQueueService: MessageQueueService,
  ) {
    super();
  }

  async run(): Promise<void> {
    await this.messageQueueService.addCron<undefined>({
      jobName: FieldFormulaTimeBasedCronJob.name,
      data: undefined,
      options: {
        repeat: { pattern: FIELD_FORMULA_TIME_BASED_CRON_PATTERN },
      },
    });
  }
}
