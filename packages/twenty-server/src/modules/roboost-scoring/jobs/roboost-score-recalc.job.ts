import { Logger } from '@nestjs/common';

import { Process } from 'src/engine/core-modules/message-queue/decorators/process.decorator';
import { Processor } from 'src/engine/core-modules/message-queue/decorators/processor.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { RoboostScoreRecalcService } from 'src/modules/roboost-scoring/services/roboost-score-recalc.service';

export type RoboostScoreRecalcJobData = {
  workspaceId: string;
  scoreId: string;
  mode: 'full' | 'verify';
};

@Processor(MessageQueue.workspaceQueue)
export class RoboostScoreRecalcJob {
  private readonly logger = new Logger(RoboostScoreRecalcJob.name);

  constructor(
    private readonly roboostScoreRecalcService: RoboostScoreRecalcService,
  ) {}

  @Process(RoboostScoreRecalcJob.name)
  async handle(data: RoboostScoreRecalcJobData): Promise<void> {
    const startedAt = Date.now();
    const totals = await this.roboostScoreRecalcService.recalculateScore(data);

    this.logger.log(
      `Score ${data.scoreId} (${data.mode}): ${totals.computed} record(s) computed, ${totals.changed} changed in ${Date.now() - startedAt} ms`,
    );
  }
}
