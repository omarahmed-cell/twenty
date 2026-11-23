import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { WorkspaceIteratorModule } from 'src/database/commands/command-runners/workspace-iterator.module';
import { FeatureFlagModule } from 'src/engine/core-modules/feature-flag/feature-flag.module';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { OAuth2ClientManagerModule } from 'src/modules/connected-account/oauth2-client-manager/oauth2-client-manager.module';
import { MeetingCalendarSyncCommand } from 'src/modules/meeting/calendar-sync/commands/meeting-calendar-sync.command';
import { MeetingCalendarSyncCronCommand } from 'src/modules/meeting/calendar-sync/crons/commands/meeting-calendar-sync.cron.command';
import { MeetingCalendarSyncCronJob } from 'src/modules/meeting/calendar-sync/crons/jobs/meeting-calendar-sync.cron.job';
import { MeetingCalendarSyncService } from 'src/modules/meeting/calendar-sync/services/meeting-calendar-sync.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([WorkspaceEntity]),
    FeatureFlagModule,
    OAuth2ClientManagerModule,
    WorkspaceIteratorModule,
  ],
  providers: [
    MeetingCalendarSyncService,
    MeetingCalendarSyncCronJob,
    MeetingCalendarSyncCronCommand,
    MeetingCalendarSyncCommand,
  ],
  exports: [MeetingCalendarSyncCronCommand, MeetingCalendarSyncCommand],
})
export class MeetingCalendarSyncModule {}
