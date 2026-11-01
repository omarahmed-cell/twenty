import { Module } from '@nestjs/common';

import { WorkspaceCacheModule } from 'src/engine/workspace-cache/workspace-cache.module';
import { FieldSyncJob } from 'src/modules/field-sync/jobs/field-sync.job';
import { FieldSyncMetadataListener } from 'src/modules/field-sync/listeners/field-sync-metadata.listener';
import { FieldSyncRecordListener } from 'src/modules/field-sync/listeners/field-sync-record.listener';
import { FieldSyncService } from 'src/modules/field-sync/services/field-sync.service';

@Module({
  imports: [WorkspaceCacheModule],
  providers: [
    FieldSyncService,
    FieldSyncJob,
    FieldSyncRecordListener,
    FieldSyncMetadataListener,
  ],
})
export class FieldSyncModule {}
