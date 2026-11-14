import { Module } from '@nestjs/common';

import { StageDateTrackingJob } from 'src/modules/stage-date-tracking/jobs/stage-date-tracking.job';
import { StageDateTrackingListener } from 'src/modules/stage-date-tracking/listeners/stage-date-tracking.listener';

@Module({
  providers: [StageDateTrackingListener, StageDateTrackingJob],
})
export class StageDateTrackingModule {}
