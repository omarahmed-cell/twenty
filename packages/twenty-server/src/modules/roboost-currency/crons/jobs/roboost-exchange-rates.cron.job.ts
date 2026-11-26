import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { WorkspaceActivationStatus } from 'twenty-shared/workspace';
import { Repository } from 'typeorm';

import { Process } from 'src/engine/core-modules/message-queue/decorators/process.decorator';
import { Processor } from 'src/engine/core-modules/message-queue/decorators/processor.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { RoboostCurrencyService } from 'src/modules/roboost-currency/services/roboost-currency.service';

// Runs every day; each workspace's frequency decides whether rates are fetched that day
export const ROBOOST_EXCHANGE_RATES_CRON_PATTERN = '0 1 * * *';

@Processor(MessageQueue.cronQueue)
export class RoboostExchangeRatesCronJob {
  private readonly logger = new Logger(RoboostExchangeRatesCronJob.name);

  constructor(
    @InjectRepository(WorkspaceEntity)
    private readonly workspaceRepository: Repository<WorkspaceEntity>,
    private readonly roboostCurrencyService: RoboostCurrencyService,
  ) {}

  @Process(RoboostExchangeRatesCronJob.name)
  async handle(): Promise<void> {
    const workspaces = await this.workspaceRepository.find({
      where: { activationStatus: WorkspaceActivationStatus.ACTIVE },
      select: ['id'],
    });

    for (const { id: workspaceId } of workspaces) {
      try {
        if (!(await this.roboostCurrencyService.tablesExist(workspaceId))) {
          continue;
        }
        const run =
          await this.roboostCurrencyService.runScheduledUpdate(workspaceId);

        this.logger.log(
          `Workspace ${workspaceId}: exchange rates ${run.status}${run.message ? ` (${run.message})` : ''}`,
        );
      } catch (error) {
        this.logger.error(
          `Could not update exchange rates for workspace ${workspaceId}: ${error}`,
        );
      }
    }
  }
}
