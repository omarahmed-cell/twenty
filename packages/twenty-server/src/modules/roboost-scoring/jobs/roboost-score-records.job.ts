import { Process } from 'src/engine/core-modules/message-queue/decorators/process.decorator';
import { Processor } from 'src/engine/core-modules/message-queue/decorators/processor.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { RoboostScoreRecalcService } from 'src/modules/roboost-scoring/services/roboost-score-recalc.service';

export type RoboostScoreRecordsJobData = {
  workspaceId: string;
  objectName: string;
  recordIds: string[];
};

@Processor(MessageQueue.workspaceQueue)
export class RoboostScoreRecordsJob {
  constructor(
    private readonly roboostScoreRecalcService: RoboostScoreRecalcService,
  ) {}

  @Process(RoboostScoreRecordsJob.name)
  async handle(data: RoboostScoreRecordsJobData): Promise<void> {
    await this.roboostScoreRecalcService.recalculateRecords(data);
  }
}
