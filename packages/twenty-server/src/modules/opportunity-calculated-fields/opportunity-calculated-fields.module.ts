import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { WorkspaceIteratorModule } from 'src/database/commands/command-runners/workspace-iterator.module';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { RecomputeOpportunityCalculatedFieldsCommand } from 'src/modules/opportunity-calculated-fields/commands/recompute-opportunity-calculated-fields.command';
import { OpportunityCalculatedFieldsNightlyCronCommand } from 'src/modules/opportunity-calculated-fields/crons/commands/opportunity-calculated-fields-nightly.cron.command';
import { OpportunityCalculatedFieldsNightlyCronJob } from 'src/modules/opportunity-calculated-fields/crons/jobs/opportunity-calculated-fields-nightly.cron.job';
import { OpportunityCalculatedFieldsJob } from 'src/modules/opportunity-calculated-fields/jobs/opportunity-calculated-fields.job';
import { OpportunityCalculatedFieldsListener } from 'src/modules/opportunity-calculated-fields/listeners/opportunity-calculated-fields.listener';
import { OpportunityCalculatedFieldsService } from 'src/modules/opportunity-calculated-fields/services/opportunity-calculated-fields.service';
import { OpportunityCalculationQueueService } from 'src/modules/opportunity-calculated-fields/services/opportunity-calculation-queue.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([WorkspaceEntity]),
    WorkspaceIteratorModule,
  ],
  providers: [
    OpportunityCalculatedFieldsService,
    OpportunityCalculationQueueService,
    OpportunityCalculatedFieldsJob,
    OpportunityCalculatedFieldsListener,
    OpportunityCalculatedFieldsNightlyCronJob,
    OpportunityCalculatedFieldsNightlyCronCommand,
    RecomputeOpportunityCalculatedFieldsCommand,
  ],
  exports: [
    OpportunityCalculationQueueService,
    OpportunityCalculatedFieldsNightlyCronCommand,
    RecomputeOpportunityCalculatedFieldsCommand,
  ],
})
export class OpportunityCalculatedFieldsModule {}
