import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserVarsModule } from 'src/engine/core-modules/user/user-vars/user-vars.module';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { RoboostNotificationRetentionCronCommand } from 'src/modules/roboost-notification/crons/commands/roboost-notification-retention.cron.command';
import { RoboostNotificationRetentionCronJob } from 'src/modules/roboost-notification/crons/jobs/roboost-notification-retention.cron.job';
import { RoboostAssignNotificationJob } from 'src/modules/roboost-notification/jobs/roboost-assign-notification.job';
import { RoboostAssignNotificationListener } from 'src/modules/roboost-notification/listeners/roboost-assign-notification.listener';
import { RoboostDataTransferResolver } from 'src/modules/roboost-notification/resolvers/roboost-data-transfer.resolver';
import { RoboostDataTransferNotificationService } from 'src/modules/roboost-notification/services/roboost-data-transfer-notification.service';
import { RoboostDataTransferService } from 'src/modules/roboost-notification/services/roboost-data-transfer.service';
import { RoboostTaskReminderCronCommand } from 'src/modules/roboost-notification/crons/commands/roboost-task-reminder.cron.command';
import { RoboostTaskReminderCronJob } from 'src/modules/roboost-notification/crons/jobs/roboost-task-reminder.cron.job';
import { RoboostTaskNotificationJob } from 'src/modules/roboost-notification/jobs/roboost-task-notification.job';
import { RoboostTaskNotificationListener } from 'src/modules/roboost-notification/listeners/roboost-task-notification.listener';
import { RoboostTaskNotificationService } from 'src/modules/roboost-notification/services/roboost-task-notification.service';
import { RoboostNotificationResolver } from 'src/modules/roboost-notification/resolvers/roboost-notification.resolver';
import { RoboostAssignNotificationService } from 'src/modules/roboost-notification/services/roboost-assign-notification.service';
import { RoboostNotificationService } from 'src/modules/roboost-notification/services/roboost-notification.service';

@Module({
  imports: [TypeOrmModule.forFeature([WorkspaceEntity]), UserVarsModule],
  providers: [
    RoboostNotificationService,
    RoboostNotificationResolver,
    RoboostAssignNotificationService,
    RoboostTaskNotificationService,
    RoboostTaskNotificationJob,
    RoboostTaskNotificationListener,
    RoboostTaskReminderCronJob,
    RoboostTaskReminderCronCommand,
    RoboostDataTransferService,
    RoboostDataTransferNotificationService,
    RoboostDataTransferResolver,
    RoboostAssignNotificationJob,
    RoboostAssignNotificationListener,
    RoboostNotificationRetentionCronJob,
    RoboostNotificationRetentionCronCommand,
  ],
  exports: [
    RoboostNotificationService,
    RoboostTaskNotificationService,
    RoboostTaskReminderCronCommand,
    RoboostNotificationRetentionCronCommand,
  ],
})
export class RoboostNotificationModule {}
