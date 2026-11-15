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
import { PERSON_CALCULATED_FIELDS_JOB_NAME } from 'src/modules/person-calculated-fields/constants/person-calculated-fields-job-name.constant';
import { type PersonCalculatedFieldsJobData } from 'src/modules/person-calculated-fields/jobs/person-calculated-fields.job';

// Also advances Time in current stage by a day, which no record write signals
export const PERSON_CALCULATED_FIELDS_NIGHTLY_CRON_PATTERN = '40 2 * * *';

@Processor(MessageQueue.cronQueue)
export class PersonCalculatedFieldsNightlyCronJob {
  private readonly logger = new Logger(
    PersonCalculatedFieldsNightlyCronJob.name,
  );

  constructor(
    @InjectRepository(WorkspaceEntity)
    private readonly workspaceRepository: Repository<WorkspaceEntity>,
    @InjectMessageQueue(MessageQueue.workspaceQueue)
    private readonly messageQueueService: MessageQueueService,
  ) {}

  @Process(PersonCalculatedFieldsNightlyCronJob.name)
  async handle(): Promise<void> {
    const workspaces = await this.workspaceRepository.find({
      where: { activationStatus: WorkspaceActivationStatus.ACTIVE },
      select: ['id'],
    });

    for (const { id: workspaceId } of workspaces) {
      try {
        await this.messageQueueService.add<PersonCalculatedFieldsJobData>(
          PERSON_CALCULATED_FIELDS_JOB_NAME,
          { workspaceId, isFullRecompute: true },
        );
      } catch (error) {
        this.logger.error(
          `Could not schedule the person recompute for workspace ${workspaceId}: ${error}`,
        );
      }
    }
  }
}
