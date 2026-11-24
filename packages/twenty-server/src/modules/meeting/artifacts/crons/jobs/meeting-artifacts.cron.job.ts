import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { FeatureFlagKey } from 'twenty-shared/types';
import { WorkspaceActivationStatus } from 'twenty-shared/workspace';
import { Repository } from 'typeorm';

import { FeatureFlagService } from 'src/engine/core-modules/feature-flag/services/feature-flag.service';
import { Process } from 'src/engine/core-modules/message-queue/decorators/process.decorator';
import { Processor } from 'src/engine/core-modules/message-queue/decorators/processor.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { MeetingArtifactsService } from 'src/modules/meeting/artifacts/services/meeting-artifacts.service';

export const MEETING_ARTIFACTS_CRON_PATTERN = '*/15 * * * *';

@Processor(MessageQueue.cronQueue)
export class MeetingArtifactsCronJob {
  private readonly logger = new Logger(MeetingArtifactsCronJob.name);

  constructor(
    @InjectRepository(WorkspaceEntity)
    private readonly workspaceRepository: Repository<WorkspaceEntity>,
    private readonly featureFlagService: FeatureFlagService,
    private readonly meetingArtifactsService: MeetingArtifactsService,
  ) {}

  @Process(MeetingArtifactsCronJob.name)
  async handle(): Promise<void> {
    const workspaces = await this.workspaceRepository.find({
      where: { activationStatus: WorkspaceActivationStatus.ACTIVE },
      select: ['id'],
    });

    for (const { id: workspaceId } of workspaces) {
      try {
        if (
          await this.featureFlagService.isFeatureEnabled(
            FeatureFlagKey.IS_UNIFIED_MEETINGS_ENABLED,
            workspaceId,
          )
        ) {
          await this.meetingArtifactsService.syncWorkspace(workspaceId);
        }
      } catch (error) {
        this.logger.error(
          `Meet artifacts failed for workspace ${workspaceId}: ${error}`,
        );
      }
    }
  }
}
