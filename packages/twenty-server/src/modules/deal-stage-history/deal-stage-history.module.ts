import { Module } from '@nestjs/common';

import { DealStageHistoryJob } from 'src/modules/deal-stage-history/jobs/deal-stage-history.job';
import { DealStageHistoryListener } from 'src/modules/deal-stage-history/listeners/deal-stage-history.listener';
import { DealStageHistoryService } from 'src/modules/deal-stage-history/services/deal-stage-history.service';

@Module({
  providers: [
    DealStageHistoryService,
    DealStageHistoryListener,
    DealStageHistoryJob,
  ],
  exports: [DealStageHistoryService],
})
export class DealStageHistoryModule {}
