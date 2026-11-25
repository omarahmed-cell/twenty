import { Module } from '@nestjs/common';

import { RoboostRecordVisibilityModule } from 'src/engine/metadata-modules/role/roboost-record-visibility.module';
import { WorkspaceCacheModule } from 'src/engine/workspace-cache/workspace-cache.module';
import { CompanyCalculatedFieldsModule } from 'src/modules/company-calculated-fields/company-calculated-fields.module';
import { OpportunityCalculatedFieldsModule } from 'src/modules/opportunity-calculated-fields/opportunity-calculated-fields.module';
import { PersonCalculatedFieldsModule } from 'src/modules/person-calculated-fields/person-calculated-fields.module';
import {
  RoboostMergeRestoreGuardService,
  RoboostMergeRestoreManyPreQueryHook,
  RoboostMergeRestoreOnePreQueryHook,
} from 'src/modules/roboost-merge/query-hooks/roboost-merge-restore.pre-query.hooks';
import { RoboostMergeResolver } from 'src/modules/roboost-merge/resolvers/roboost-merge.resolver';
import { RoboostMergeActorService } from 'src/modules/roboost-merge/services/roboost-merge-actor.service';
import { RoboostMergeAfterEffectsService } from 'src/modules/roboost-merge/services/roboost-merge-after-effects.service';
import { RoboostMergeService } from 'src/modules/roboost-merge/services/roboost-merge.service';
import { SegmentModule } from 'src/modules/segment/segment.module';

@Module({
  imports: [
    RoboostRecordVisibilityModule,
    WorkspaceCacheModule,
    SegmentModule,
    CompanyCalculatedFieldsModule,
    PersonCalculatedFieldsModule,
    OpportunityCalculatedFieldsModule,
  ],
  providers: [
    RoboostMergeService,
    RoboostMergeActorService,
    RoboostMergeAfterEffectsService,
    RoboostMergeResolver,
    RoboostMergeRestoreGuardService,
    RoboostMergeRestoreOnePreQueryHook,
    RoboostMergeRestoreManyPreQueryHook,
  ],
  exports: [RoboostMergeService, RoboostMergeActorService],
})
export class RoboostMergeModule {}
