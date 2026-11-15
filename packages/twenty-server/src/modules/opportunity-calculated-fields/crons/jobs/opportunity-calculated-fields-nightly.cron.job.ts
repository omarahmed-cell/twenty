import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { WorkspaceActivationStatus } from 'twenty-shared/workspace';
import { Repository } from 'typeorm';

import { InjectMessageQueue } from 'src/engine/core-modules/message-queue/decorators/message-queue.decorator';
import { Process } from 'src/engine/core-modules/message-queue/decorators/process.decorator';
import { Processor } from 'src/engine/core-modules/message-queue/decorators/processor.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { OPPORTUNITY_CALCULATED_FIELDS_JOB_NAME } from 'src/modules/opportunity-calculated-fields/constants/opportunity-calculated-fields-job-name.constant';
import { type OpportunityCalculatedFieldsJobData } from 'src/modules/opportunity-calculated-fields/jobs/opportunity-calculated-fields.job';

// A safety net for writes that bypass the ORM events
export const OPPORTUNITY_CALCULATED_FIELDS_NIGHTLY_CRON_PATTERN = '50 2 * * *';

@Processor(MessageQueue.cronQueue)
export class OpportunityCalculatedFieldsNightlyCronJob {
  private readonly logger = new Logger(
    OpportunityCalculatedFieldsNightlyCronJob.name,
  );

  constructor(
    @InjectRepository(WorkspaceEntity)
    private readonly workspaceRepository: Repository<WorkspaceEntity>,
    @InjectMessageQueue(MessageQueue.workspaceQueue)
    private readonly messageQueueService: MessageQueueService,
  ) {}

  @Process(OpportunityCalculatedFieldsNightlyCronJob.name)
  async handle(): Promise<void> {
    const workspaces = await this.workspaceRepository.find({
      where: { activationStatus: WorkspaceActivationStatus.ACTIVE },
      select: ['id'],
    });

    for (const { id: workspaceId } of workspaces) {
      try {
        await this.messageQueueService.add<OpportunityCalculatedFieldsJobData>(
          OPPORTUNITY_CALCULATED_FIELDS_JOB_NAME,
          { workspaceId, isFullRecompute: true },
        );
      } catch (error) {
        this.logger.error(
          `Could not schedule the deal recompute for workspace ${workspaceId}: ${error}`,
        );
      }
    }
  }
}
