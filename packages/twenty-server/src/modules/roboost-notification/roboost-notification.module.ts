import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserVarsModule } from 'src/engine/core-modules/user/user-vars/user-vars.module';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { RoboostNotificationRetentionCronCommand } from 'src/modules/roboost-notification/crons/commands/roboost-notification-retention.cron.command';
import { RoboostNotificationRetentionCronJob } from 'src/modules/roboost-notification/crons/jobs/roboost-notification-retention.cron.job';
import { RoboostAssignNotificationJob } from 'src/modules/roboost-notification/jobs/roboost-assign-notification.job';
import { RoboostAssignNotificationListener } from 'src/modules/roboost-notification/listeners/roboost-assign-notification.listener';
import { RoboostNotificationResolver } from 'src/modules/roboost-notification/resolvers/roboost-notification.resolver';
import { RoboostAssignNotificationService } from 'src/modules/roboost-notification/services/roboost-assign-notification.service';
import { RoboostNotificationService } from 'src/modules/roboost-notification/services/roboost-notification.service';

@Module({
  imports: [TypeOrmModule.forFeature([WorkspaceEntity]), UserVarsModule],
  providers: [
    RoboostNotificationService,
    RoboostNotificationResolver,
    RoboostAssignNotificationService,
    RoboostAssignNotificationJob,
    RoboostAssignNotificationListener,
    RoboostNotificationRetentionCronJob,
    RoboostNotificationRetentionCronCommand,
  ],
  exports: [
    RoboostNotificationService,
    RoboostNotificationRetentionCronCommand,
  ],
})
export class RoboostNotificationModule {}
