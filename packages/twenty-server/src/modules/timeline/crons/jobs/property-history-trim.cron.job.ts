import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { WorkspaceActivationStatus } from 'twenty-shared/workspace';
import { Repository } from 'typeorm';

import { Process } from 'src/engine/core-modules/message-queue/decorators/process.decorator';
import { Processor } from 'src/engine/core-modules/message-queue/decorators/processor.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { PropertyHistoryTrimService } from 'src/modules/timeline/services/property-history-trim.service';

// After the 00:37 UTC backup, so trimmed history is still in that night's dump
export const PROPERTY_HISTORY_TRIM_CRON_PATTERN = '15 1 * * *';

@Processor(MessageQueue.cronQueue)
export class PropertyHistoryTrimCronJob {
  private readonly logger = new Logger(PropertyHistoryTrimCronJob.name);

  constructor(
    @InjectRepository(WorkspaceEntity)
    private readonly workspaceRepository: Repository<WorkspaceEntity>,
    private readonly propertyHistoryTrimService: PropertyHistoryTrimService,
  ) {}

  @Process(PropertyHistoryTrimCronJob.name)
  async handle(): Promise<void> {
    const workspaces = await this.workspaceRepository.find({
      where: { activationStatus: WorkspaceActivationStatus.ACTIVE },
      select: ['id'],
    });

    for (const { id: workspaceId } of workspaces) {
      try {
        await this.propertyHistoryTrimService.trimWorkspace(workspaceId);
      } catch (error) {
        this.logger.error(
          `Could not trim property history for workspace ${workspaceId}: ${error}`,
        );
      }
    }
  }
}
