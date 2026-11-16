import { Module } from '@nestjs/common';

import { ApplicationModule } from 'src/engine/core-modules/application/application.module';
import { FieldMetadataModule } from 'src/engine/metadata-modules/field-metadata/field-metadata.module';
import { WorkspaceManyOrAllFlatEntityMapsCacheModule } from 'src/engine/metadata-modules/flat-entity/services/workspace-many-or-all-flat-entity-maps-cache.module';
import { WorkspaceCacheModule } from 'src/engine/workspace-cache/workspace-cache.module';
import { CompanyCalculatedFieldsModule } from 'src/modules/company-calculated-fields/company-calculated-fields.module';
import { OpportunityCalculatedFieldsModule } from 'src/modules/opportunity-calculated-fields/opportunity-calculated-fields.module';
import { DealCloseDateJob } from 'src/modules/pipeline/jobs/deal-close-date.job';
import { PipelineSyncJob } from 'src/modules/pipeline/jobs/pipeline-sync.job';
import { DealCloseDateListener } from 'src/modules/pipeline/listeners/deal-close-date.listener';
import { PipelineConfigListener } from 'src/modules/pipeline/listeners/pipeline-config.listener';
import { PIPELINE_QUERY_HOOKS } from 'src/modules/pipeline/query-hooks/pipeline-query-hooks.constant';
import { PipelineResolver } from 'src/modules/pipeline/resolvers/pipeline.resolver';
import { DealPipelineRulesService } from 'src/modules/pipeline/services/deal-pipeline-rules.service';
import { DealStageEntryRulesService } from 'src/modules/pipeline/services/deal-stage-entry-rules.service';
import { DealPipelineIntegrityService } from 'src/modules/pipeline/services/deal-pipeline-integrity.service';
import { PipelineAccessService } from 'src/modules/pipeline/services/pipeline-access.service';
import { PipelineCloneService } from 'src/modules/pipeline/services/pipeline-clone.service';
import { PipelineConfigService } from 'src/modules/pipeline/services/pipeline-config.service';
import { PipelineSyncService } from 'src/modules/pipeline/services/pipeline-sync.service';
import { PipelineWriteGuardService } from 'src/modules/pipeline/services/pipeline-write-guard.service';

@Module({
  imports: [
    ApplicationModule,
    FieldMetadataModule,
    WorkspaceManyOrAllFlatEntityMapsCacheModule,
    WorkspaceCacheModule,
    CompanyCalculatedFieldsModule,
    OpportunityCalculatedFieldsModule,
  ],
  providers: [
    PipelineConfigService,
    PipelineSyncService,
    PipelineAccessService,
    PipelineWriteGuardService,
    PipelineCloneService,
    DealPipelineIntegrityService,
    DealPipelineRulesService,
    DealStageEntryRulesService,
    PipelineResolver,
    PipelineConfigListener,
    DealCloseDateListener,
    PipelineSyncJob,
    DealCloseDateJob,
    ...PIPELINE_QUERY_HOOKS,
  ],
  exports: [PipelineConfigService, PipelineSyncService],
})
export class PipelineModule {}
