import { Module } from '@nestjs/common';

import { RoboostRecordVisibilityService } from 'src/engine/metadata-modules/role/services/roboost-record-visibility.service';
import { WorkspaceCacheModule } from 'src/engine/workspace-cache/workspace-cache.module';

@Module({
  imports: [WorkspaceCacheModule],
  providers: [RoboostRecordVisibilityService],
  exports: [RoboostRecordVisibilityService],
})
export class RoboostRecordVisibilityModule {}
