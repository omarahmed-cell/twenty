import { Module } from '@nestjs/common';

import { AssignedDateTrackingJob } from 'src/modules/assigned-date-tracking/jobs/assigned-date-tracking.job';
import { AssignedDateTrackingListener } from 'src/modules/assigned-date-tracking/listeners/assigned-date-tracking.listener';

@Module({
  providers: [AssignedDateTrackingListener, AssignedDateTrackingJob],
})
export class AssignedDateTrackingModule {}
