import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserVarsModule } from 'src/engine/core-modules/user/user-vars/user-vars.module';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { RoboostNotificationRetentionCronCommand } from 'src/modules/roboost-notification/crons/commands/roboost-notification-retention.cron.command';
import { RoboostNotificationRetentionCronJob } from 'src/modules/roboost-notification/crons/jobs/roboost-notification-retention.cron.job';
import { RoboostNotificationResolver } from 'src/modules/roboost-notification/resolvers/roboost-notification.resolver';
import { RoboostNotificationService } from 'src/modules/roboost-notification/services/roboost-notification.service';

@Module({
  imports: [TypeOrmModule.forFeature([WorkspaceEntity]), UserVarsModule],
  providers: [
    RoboostNotificationService,
    RoboostNotificationResolver,
    RoboostNotificationRetentionCronJob,
    RoboostNotificationRetentionCronCommand,
  ],
  exports: [
    RoboostNotificationService,
    RoboostNotificationRetentionCronCommand,
  ],
})
export class RoboostNotificationModule {}
