import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { WorkspaceIteratorModule } from 'src/database/commands/command-runners/workspace-iterator.module';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { RecomputeCompanyCalculatedFieldsCommand } from 'src/modules/company-calculated-fields/commands/recompute-company-calculated-fields.command';
import { CompanyCalculatedFieldsNightlyCronCommand } from 'src/modules/company-calculated-fields/crons/commands/company-calculated-fields-nightly.cron.command';
import { CompanyPastMeetingsCronCommand } from 'src/modules/company-calculated-fields/crons/commands/company-past-meetings.cron.command';
import { CompanyCalculatedFieldsNightlyCronJob } from 'src/modules/company-calculated-fields/crons/jobs/company-calculated-fields-nightly.cron.job';
import { OpportunityCalculatedFieldsModule } from 'src/modules/opportunity-calculated-fields/opportunity-calculated-fields.module';
import { PersonCalculatedFieldsModule } from 'src/modules/person-calculated-fields/person-calculated-fields.module';
import { CompanyPastMeetingsCronJob } from 'src/modules/company-calculated-fields/crons/jobs/company-past-meetings.cron.job';
import { CompanyCalculatedFieldsJob } from 'src/modules/company-calculated-fields/jobs/company-calculated-fields.job';
import { CompanyCalculatedFieldsListener } from 'src/modules/company-calculated-fields/listeners/company-calculated-fields.listener';
import { CompanyCalculatedFieldsService } from 'src/modules/company-calculated-fields/services/company-calculated-fields.service';
import { CompanyCalculationQueueService } from 'src/modules/company-calculated-fields/services/company-calculation-queue.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([WorkspaceEntity]),
    WorkspaceIteratorModule,
    PersonCalculatedFieldsModule,
    OpportunityCalculatedFieldsModule,
  ],
  providers: [
    CompanyCalculatedFieldsService,
    CompanyCalculationQueueService,
    CompanyCalculatedFieldsJob,
    CompanyCalculatedFieldsListener,
    CompanyCalculatedFieldsNightlyCronJob,
    CompanyPastMeetingsCronJob,
    CompanyCalculatedFieldsNightlyCronCommand,
    CompanyPastMeetingsCronCommand,
    RecomputeCompanyCalculatedFieldsCommand,
  ],
  exports: [
    CompanyCalculatedFieldsNightlyCronCommand,
    CompanyPastMeetingsCronCommand,
    RecomputeCompanyCalculatedFieldsCommand,
  ],
})
export class CompanyCalculatedFieldsModule {}
