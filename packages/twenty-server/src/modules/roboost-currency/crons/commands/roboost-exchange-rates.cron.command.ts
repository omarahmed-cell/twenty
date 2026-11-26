import { Command, CommandRunner } from 'nest-commander';

import { InjectMessageQueue } from 'src/engine/core-modules/message-queue/decorators/message-queue.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';
import {
  ROBOOST_EXCHANGE_RATES_CRON_PATTERN,
  RoboostExchangeRatesCronJob,
} from 'src/modules/roboost-currency/crons/jobs/roboost-exchange-rates.cron.job';

@Command({
  name: 'cron:roboost-exchange-rates',
  description:
    'Starts the cron that fetches exchange rates every day at 01:00 UTC (each workspace frequency decides if it is due)',
})
export class RoboostExchangeRatesCronCommand extends CommandRunner {
  constructor(
    @InjectMessageQueue(MessageQueue.cronQueue)
    private readonly messageQueueService: MessageQueueService,
  ) {
    super();
  }

  async run(): Promise<void> {
    await this.messageQueueService.addCron<undefined>({
      jobName: RoboostExchangeRatesCronJob.name,
      data: undefined,
      options: {
        repeat: { pattern: ROBOOST_EXCHANGE_RATES_CRON_PATTERN },
      },
    });
  }
}
