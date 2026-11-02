import { Module } from '@nestjs/common';

import { FieldMetadataModule } from 'src/engine/metadata-modules/field-metadata/field-metadata.module';
import { PermissionsModule } from 'src/engine/metadata-modules/permissions/permissions.module';
import { WorkspaceCacheModule } from 'src/engine/workspace-cache/workspace-cache.module';
import { FieldSyncJob } from 'src/modules/field-sync/jobs/field-sync.job';
import { FieldSyncMetadataListener } from 'src/modules/field-sync/listeners/field-sync-metadata.listener';
import { FieldSyncRecordListener } from 'src/modules/field-sync/listeners/field-sync-record.listener';
import { FieldSyncResolver } from 'src/modules/field-sync/resolvers/field-sync.resolver';
import { FieldSyncService } from 'src/modules/field-sync/services/field-sync.service';

@Module({
  imports: [WorkspaceCacheModule, FieldMetadataModule, PermissionsModule],
  providers: [
    FieldSyncService,
    FieldSyncJob,
    FieldSyncRecordListener,
    FieldSyncMetadataListener,
    FieldSyncResolver,
  ],
})
export class FieldSyncModule {}
