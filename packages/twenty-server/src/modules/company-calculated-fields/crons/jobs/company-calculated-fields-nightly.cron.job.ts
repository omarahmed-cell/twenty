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
import {
  CompanyCalculatedFieldsJob,
  type CompanyCalculatedFieldsJobData,
} from 'src/modules/company-calculated-fields/jobs/company-calculated-fields.job';

// Safety net for anything the live recompute missed, such as hard-deleted activities
export const COMPANY_CALCULATED_FIELDS_NIGHTLY_CRON_PATTERN = '30 2 * * *';

@Processor(MessageQueue.cronQueue)
export class CompanyCalculatedFieldsNightlyCronJob {
  private readonly logger = new Logger(
    CompanyCalculatedFieldsNightlyCronJob.name,
  );

  constructor(
    @InjectRepository(WorkspaceEntity)
    private readonly workspaceRepository: Repository<WorkspaceEntity>,
    @InjectMessageQueue(MessageQueue.workspaceQueue)
    private readonly messageQueueService: MessageQueueService,
  ) {}

  @Process(CompanyCalculatedFieldsNightlyCronJob.name)
  async handle(): Promise<void> {
    const workspaces = await this.workspaceRepository.find({
      where: { activationStatus: WorkspaceActivationStatus.ACTIVE },
      select: ['id'],
    });

    for (const { id: workspaceId } of workspaces) {
      try {
        await this.messageQueueService.add<CompanyCalculatedFieldsJobData>(
          CompanyCalculatedFieldsJob.name,
          { workspaceId, isFullRecompute: true },
        );
      } catch (error) {
        this.logger.error(
          `Could not schedule the company recompute for workspace ${workspaceId}: ${error}`,
        );
      }
    }
  }
}
