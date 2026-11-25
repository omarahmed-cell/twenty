import { RoboostRecordVisibilityModule } from 'src/engine/metadata-modules/role/roboost-record-visibility.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { WorkspaceIteratorModule } from 'src/database/commands/command-runners/workspace-iterator.module';
import { RoboostScoreFreezeImportedCommand } from 'src/modules/roboost-scoring/commands/roboost-score-freeze-imported.command';
import { FieldMetadataModule } from 'src/engine/metadata-modules/field-metadata/field-metadata.module';
import { WorkspaceCacheModule } from 'src/engine/workspace-cache/workspace-cache.module';
import { RoboostScoreVerifyCronCommand } from 'src/modules/roboost-scoring/crons/commands/roboost-score-verify.cron.command';
import { RoboostScoreVerifyCronJob } from 'src/modules/roboost-scoring/crons/jobs/roboost-score-verify.cron.job';
import { RoboostScoreRecalcJob } from 'src/modules/roboost-scoring/jobs/roboost-score-recalc.job';
import { RoboostScoreRecordsJob } from 'src/modules/roboost-scoring/jobs/roboost-score-records.job';
import { RoboostScoreRecordListener } from 'src/modules/roboost-scoring/listeners/roboost-score-record.listener';
import { RoboostScoreResolver } from 'src/modules/roboost-scoring/resolvers/roboost-score.resolver';
import { RoboostScoreEngineService } from 'src/modules/roboost-scoring/services/roboost-score-engine.service';
import { RoboostScorePropertyService } from 'src/modules/roboost-scoring/services/roboost-score-property.service';
import { RoboostScoreRecalcService } from 'src/modules/roboost-scoring/services/roboost-score-recalc.service';
import { RoboostScoreStoreService } from 'src/modules/roboost-scoring/services/roboost-score-store.service';
import { RoboostScoreService } from 'src/modules/roboost-scoring/services/roboost-score.service';
import { TimelineActivityModule } from 'src/modules/timeline/timeline-activity.module';

@Module({
  imports: [
    RoboostRecordVisibilityModule,
    TypeOrmModule.forFeature([WorkspaceEntity]),
    FieldMetadataModule,
    WorkspaceCacheModule,
    TimelineActivityModule,
    WorkspaceIteratorModule,
  ],
  providers: [
    RoboostScoreStoreService,
    RoboostScoreEngineService,
    RoboostScorePropertyService,
    RoboostScoreRecalcService,
    RoboostScoreService,
    RoboostScoreResolver,
    RoboostScoreRecalcJob,
    RoboostScoreRecordsJob,
    RoboostScoreRecordListener,
    RoboostScoreVerifyCronJob,
    RoboostScoreVerifyCronCommand,
    RoboostScoreFreezeImportedCommand,
  ],
  exports: [
    RoboostScoreStoreService,
    RoboostScoreVerifyCronCommand,
    RoboostScoreFreezeImportedCommand,
  ],
})
export class RoboostScoringModule {}
