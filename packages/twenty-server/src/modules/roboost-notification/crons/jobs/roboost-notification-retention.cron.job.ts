import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { WorkspaceActivationStatus } from 'twenty-shared/workspace';
import { Repository } from 'typeorm';

import { Process } from 'src/engine/core-modules/message-queue/decorators/process.decorator';
import { Processor } from 'src/engine/core-modules/message-queue/decorators/processor.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { RoboostDataTransferService } from 'src/modules/roboost-notification/services/roboost-data-transfer.service';
import { RoboostNotificationService } from 'src/modules/roboost-notification/services/roboost-notification.service';

// After the 00:37 UTC backup and the 01:15 property history trim
export const ROBOOST_NOTIFICATION_RETENTION_CRON_PATTERN = '30 1 * * *';

@Processor(MessageQueue.cronQueue)
export class RoboostNotificationRetentionCronJob {
  private readonly logger = new Logger(
    RoboostNotificationRetentionCronJob.name,
  );

  constructor(
    @InjectRepository(WorkspaceEntity)
    private readonly workspaceRepository: Repository<WorkspaceEntity>,
    private readonly roboostNotificationService: RoboostNotificationService,
    private readonly roboostDataTransferService: RoboostDataTransferService,
  ) {}

  @Process(RoboostNotificationRetentionCronJob.name)
  async handle(): Promise<void> {
    const workspaces = await this.workspaceRepository.find({
      where: { activationStatus: WorkspaceActivationStatus.ACTIVE },
      select: ['id'],
    });

    for (const { id: workspaceId } of workspaces) {
      try {
        if (await this.roboostDataTransferService.tablesExist(workspaceId)) {
          const expired =
            await this.roboostDataTransferService.expireExportFiles(
              workspaceId,
            );

          if (expired > 0) {
            this.logger.log(
              `Workspace ${workspaceId}: ${expired} export file(s) expired after 30 days`,
            );
          }
        }
        if (!(await this.roboostNotificationService.tableExists(workspaceId))) {
          continue;
        }
        const removed =
          await this.roboostNotificationService.applyRetention(workspaceId);

        if (removed > 0) {
          this.logger.log(
            `Workspace ${workspaceId}: removed ${removed} old notification(s)`,
          );
        }
      } catch (error) {
        this.logger.error(
          `Could not clean notifications for workspace ${workspaceId}: ${error}`,
        );
      }
    }
  }
}
