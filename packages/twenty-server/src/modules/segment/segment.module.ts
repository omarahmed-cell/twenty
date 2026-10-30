import { Module } from '@nestjs/common';

import { CoreCommonApiModule } from 'src/engine/api/common/core-common-api.module';
import { ActorModule } from 'src/engine/core-modules/actor/actor.module';
import { ApplicationModule } from 'src/engine/core-modules/application/application.module';
import { CacheLockModule } from 'src/engine/core-modules/cache-lock/cache-lock.module';
import { RecordCrudModule } from 'src/engine/core-modules/record-crud/record-crud.module';
import { FieldMetadataModule } from 'src/engine/metadata-modules/field-metadata/field-metadata.module';
import { WorkspaceCacheModule } from 'src/engine/workspace-cache/workspace-cache.module';
import { SegmentSyncJob } from 'src/modules/segment/jobs/segment-sync.job';
import { SegmentSyncListener } from 'src/modules/segment/listeners/segment-sync.listener';
import { SegmentUpdateManyPreQueryHook } from 'src/modules/segment/query-hooks/segment-update-many.pre-query.hook';
import { SegmentUpdateOnePreQueryHook } from 'src/modules/segment/query-hooks/segment-update-one.pre-query.hook';
import { SegmentMembershipResolver } from 'src/modules/segment/resolvers/segment-membership.resolver';
import { SegmentMembershipOptionsService } from 'src/modules/segment/services/segment-membership-options.service';
import { SegmentMembershipSyncService } from 'src/modules/segment/services/segment-membership-sync.service';
import { SegmentMembershipService } from 'src/modules/segment/services/segment-membership.service';
import { SegmentPullService } from 'src/modules/segment/services/segment-pull.service';

@Module({
  imports: [
    ActorModule,
    ApplicationModule,
    CacheLockModule,
    CoreCommonApiModule,
    FieldMetadataModule,
    RecordCrudModule,
    WorkspaceCacheModule,
  ],
  providers: [
    SegmentMembershipOptionsService,
    SegmentMembershipSyncService,
    SegmentMembershipService,
    SegmentPullService,
    SegmentMembershipResolver,
    SegmentSyncJob,
    SegmentSyncListener,
    SegmentUpdateOnePreQueryHook,
    SegmentUpdateManyPreQueryHook,
  ],
})
export class SegmentModule {}
