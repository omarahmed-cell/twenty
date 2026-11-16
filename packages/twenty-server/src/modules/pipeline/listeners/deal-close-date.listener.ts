import { Injectable } from '@nestjs/common';

import { type ObjectRecordBaseEvent } from 'twenty-shared/database-events';
import { isDefined } from 'twenty-shared/utils';

import { OnDatabaseBatchEvent } from 'src/engine/api/graphql/graphql-query-runner/decorators/on-database-batch-event.decorator';
import { DatabaseEventAction } from 'src/engine/api/graphql/graphql-query-runner/enums/database-event-action';
import { InjectMessageQueue } from 'src/engine/core-modules/message-queue/decorators/message-queue.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';
import { type WorkspaceEventBatch } from 'src/engine/workspace-event-emitter/types/workspace-event-batch.type';
import { isImportWrite } from 'src/modules/assigned-date-tracking/utils/is-import-write.util';
import { DEAL_CLOSE_DATE_JOB_NAME } from 'src/modules/pipeline/constants/pipeline-job-names.constant';
import { type DealCloseDateJobData } from 'src/modules/pipeline/jobs/deal-close-date.job';
import { PipelineConfigService } from 'src/modules/pipeline/services/pipeline-config.service';
import { computeDealCloseDateUpdate } from 'src/modules/pipeline/utils/compute-deal-close-date-update.util';

type DealEventBatch = WorkspaceEventBatch<
  ObjectRecordBaseEvent<Record<string, unknown>>
>;

// Listens to the ORM, so stage moves from the UI, API and workflows all date the close
@Injectable()
export class DealCloseDateListener {
  constructor(
    @InjectMessageQueue(MessageQueue.workspaceQueue)
    private readonly messageQueueService: MessageQueueService,
    private readonly pipelineConfigService: PipelineConfigService,
  ) {}

  @OnDatabaseBatchEvent('opportunity', DatabaseEventAction.CREATED)
  async handleCreated(batch: DealEventBatch) {
    await this.handleBatch(batch, false);
  }

  @OnDatabaseBatchEvent('opportunity', DatabaseEventAction.UPDATED)
  async handleUpdated(batch: DealEventBatch) {
    await this.handleBatch(batch, true);
  }

  @OnDatabaseBatchEvent('opportunity', DatabaseEventAction.UPSERTED)
  async handleUpserted(batch: DealEventBatch) {
    await this.handleBatch(batch, true);
  }

  private async handleBatch(batch: DealEventBatch, isUpdate: boolean) {
    const pipelines = await this.pipelineConfigService.getPipelines({
      workspaceId: batch.workspaceId,
    });
    const probabilityByStageValue = new Map(
      pipelines.flatMap((pipeline) =>
        pipeline.stages.map((stage) => [stage.value, stage.probability]),
      ),
    );
    const today = new Date().toISOString();

    const updates = batch.events
      .map((event) => {
        const before = event.properties?.before;
        const after = event.properties?.after;
        const recordId = event.recordId ?? (after?.id as string | undefined);

        if (!isDefined(recordId) || !isDefined(after)) {
          return null;
        }

        const update = computeDealCloseDateUpdate({
          isImport: isImportWrite(after, isUpdate),
          isCreate: !isUpdate,
          previousStageProbability: probabilityByStageValue.get(
            before?.stage as string,
          ),
          nextStageProbability: probabilityByStageValue.get(
            after.stage as string,
          ),
          hasStageChanged: isUpdate && before?.stage !== after.stage,
          currentCloseDate: after.closeDate as string | null | undefined,
          today,
        });

        return isDefined(update) ? { recordId, ...update } : null;
      })
      .filter(isDefined);

    if (updates.length === 0) {
      return;
    }

    await this.messageQueueService.add<DealCloseDateJobData>(
      DEAL_CLOSE_DATE_JOB_NAME,
      { workspaceId: batch.workspaceId, updates },
    );
  }
}
