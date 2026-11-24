import { Module } from '@nestjs/common';

import { TimelineActivityModule } from 'src/modules/timeline/timeline-activity.module';
import { StageDateTrackingJob } from 'src/modules/stage-date-tracking/jobs/stage-date-tracking.job';
import { StageDateTrackingListener } from 'src/modules/stage-date-tracking/listeners/stage-date-tracking.listener';

@Module({
  imports: [TimelineActivityModule],
  providers: [StageDateTrackingListener, StageDateTrackingJob],
})
export class StageDateTrackingModule {}
