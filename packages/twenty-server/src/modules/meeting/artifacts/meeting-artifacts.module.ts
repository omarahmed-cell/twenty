import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { WorkspaceIteratorModule } from 'src/database/commands/command-runners/workspace-iterator.module';
import { FeatureFlagModule } from 'src/engine/core-modules/feature-flag/feature-flag.module';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { OAuth2ClientManagerModule } from 'src/modules/connected-account/oauth2-client-manager/oauth2-client-manager.module';
import { MeetingArtifactsCommand } from 'src/modules/meeting/artifacts/commands/meeting-artifacts.command';
import { MeetingArtifactsCronCommand } from 'src/modules/meeting/artifacts/crons/commands/meeting-artifacts.cron.command';
import { MeetingArtifactsCronJob } from 'src/modules/meeting/artifacts/crons/jobs/meeting-artifacts.cron.job';
import { MeetingArtifactsService } from 'src/modules/meeting/artifacts/services/meeting-artifacts.service';
import { MeetingSchedulingModule } from 'src/modules/meeting/scheduling/meeting-scheduling.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([WorkspaceEntity]),
    FeatureFlagModule,
    OAuth2ClientManagerModule,
    WorkspaceIteratorModule,
    MeetingSchedulingModule,
  ],
  providers: [
    MeetingArtifactsService,
    MeetingArtifactsCronJob,
    MeetingArtifactsCronCommand,
    MeetingArtifactsCommand,
  ],
  exports: [MeetingArtifactsCronCommand, MeetingArtifactsCommand],
})
export class MeetingArtifactsModule {}
