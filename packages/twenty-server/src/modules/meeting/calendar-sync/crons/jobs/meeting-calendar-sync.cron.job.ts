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
import { MeetingCalendarSyncService } from 'src/modules/meeting/calendar-sync/services/meeting-calendar-sync.service';

export const MEETING_CALENDAR_SYNC_CRON_PATTERN = '*/5 * * * *';

@Processor(MessageQueue.cronQueue)
export class MeetingCalendarSyncCronJob {
  private readonly logger = new Logger(MeetingCalendarSyncCronJob.name);

  constructor(
    @InjectRepository(WorkspaceEntity)
    private readonly workspaceRepository: Repository<WorkspaceEntity>,
    private readonly featureFlagService: FeatureFlagService,
    private readonly meetingCalendarSyncService: MeetingCalendarSyncService,
  ) {}

  @Process(MeetingCalendarSyncCronJob.name)
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
          await this.meetingCalendarSyncService.syncWorkspace(workspaceId);
        }
      } catch (error) {
        this.logger.error(
          `Meeting calendar sync failed for workspace ${workspaceId}: ${error}`,
        );
      }
    }
  }
}
