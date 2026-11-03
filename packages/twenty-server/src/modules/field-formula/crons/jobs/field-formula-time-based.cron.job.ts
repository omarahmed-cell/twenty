import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { isFormulaTimeBased } from 'twenty-shared/utils';
import { WorkspaceActivationStatus } from 'twenty-shared/workspace';
import { Repository } from 'typeorm';

import { InjectMessageQueue } from 'src/engine/core-modules/message-queue/decorators/message-queue.decorator';
import { Process } from 'src/engine/core-modules/message-queue/decorators/process.decorator';
import { Processor } from 'src/engine/core-modules/message-queue/decorators/processor.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import {
  FieldFormulaJob,
  type FieldFormulaJobData,
} from 'src/modules/field-formula/jobs/field-formula.job';
import { FieldFormulaService } from 'src/modules/field-formula/services/field-formula.service';

// Just after the hour, the step at which the formula clock moves.
export const FIELD_FORMULA_TIME_BASED_CRON_PATTERN = '1 * * * *';

@Processor(MessageQueue.cronQueue)
export class FieldFormulaTimeBasedCronJob {
  private readonly logger = new Logger(FieldFormulaTimeBasedCronJob.name);

  constructor(
    @InjectRepository(WorkspaceEntity)
    private readonly workspaceRepository: Repository<WorkspaceEntity>,
    private readonly fieldFormulaService: FieldFormulaService,
    @InjectMessageQueue(MessageQueue.workspaceQueue)
    private readonly messageQueueService: MessageQueueService,
  ) {}

  @Process(FieldFormulaTimeBasedCronJob.name)
  async handle(): Promise<void> {
    const workspaces = await this.workspaceRepository.find({
      where: { activationStatus: WorkspaceActivationStatus.ACTIVE },
      select: ['id'],
    });

    for (const { id: workspaceId } of workspaces) {
      try {
        const configs = await this.fieldFormulaService.getConfigs(workspaceId);

        if (configs.some(({ expression }) => isFormulaTimeBased(expression))) {
          await this.messageQueueService.add<FieldFormulaJobData>(
            FieldFormulaJob.name,
            { type: 'TIME_BASED', workspaceId },
          );
        }
      } catch (error) {
        this.logger.error(
          `Could not schedule time-based formulas for workspace ${workspaceId}: ${error}`,
        );
      }
    }
  }
}
