import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TimelineActivityModule } from 'src/modules/timeline/timeline-activity.module';
import { WorkspaceIteratorModule } from 'src/database/commands/command-runners/workspace-iterator.module';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { RecomputePersonCalculatedFieldsCommand } from 'src/modules/person-calculated-fields/commands/recompute-person-calculated-fields.command';
import { PersonCalculatedFieldsNightlyCronCommand } from 'src/modules/person-calculated-fields/crons/commands/person-calculated-fields-nightly.cron.command';
import { PersonCalculatedFieldsNightlyCronJob } from 'src/modules/person-calculated-fields/crons/jobs/person-calculated-fields-nightly.cron.job';
import { PersonCalculatedFieldsJob } from 'src/modules/person-calculated-fields/jobs/person-calculated-fields.job';
import { PersonCalculatedFieldsListener } from 'src/modules/person-calculated-fields/listeners/person-calculated-fields.listener';
import { PersonCalculatedFieldsService } from 'src/modules/person-calculated-fields/services/person-calculated-fields.service';
import { PersonCalculationQueueService } from 'src/modules/person-calculated-fields/services/person-calculation-queue.service';

@Module({
  imports: [
    TimelineActivityModule,
    TypeOrmModule.forFeature([WorkspaceEntity]),
    WorkspaceIteratorModule,
  ],
  providers: [
    PersonCalculatedFieldsService,
    PersonCalculationQueueService,
    PersonCalculatedFieldsJob,
    PersonCalculatedFieldsListener,
    PersonCalculatedFieldsNightlyCronJob,
    PersonCalculatedFieldsNightlyCronCommand,
    RecomputePersonCalculatedFieldsCommand,
  ],
  exports: [
    PersonCalculationQueueService,
    PersonCalculatedFieldsNightlyCronCommand,
    RecomputePersonCalculatedFieldsCommand,
  ],
})
export class PersonCalculatedFieldsModule {}
