import { Injectable } from '@nestjs/common';

import { type ObjectRecordBaseEvent } from 'twenty-shared/database-events';
import { type PipelineObjectNameSingular } from 'twenty-shared/utils';

import { RoboostLoadModeService } from 'src/engine/core-modules/roboost-load-mode/roboost-load-mode.service';
import { OnDatabaseBatchEvent } from 'src/engine/api/graphql/graphql-query-runner/decorators/on-database-batch-event.decorator';
import { DatabaseEventAction } from 'src/engine/api/graphql/graphql-query-runner/enums/database-event-action';
import { InjectMessageQueue } from 'src/engine/core-modules/message-queue/decorators/message-queue.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';
import { type WorkspaceEventBatch } from 'src/engine/workspace-event-emitter/types/workspace-event-batch.type';
import { DEAL_STAGE_HISTORY_JOB_NAME } from 'src/modules/deal-stage-history/constants/deal-stage-history-job-name.constant';
import { type DealStageHistoryJobData } from 'src/modules/deal-stage-history/jobs/deal-stage-history.job';
import { buildDealStageChanges } from 'src/modules/deal-stage-history/utils/build-deal-stage-changes.util';
import { isWorkflowRecordWrite } from 'src/modules/workflow/workflow-executor/workflow-actions/record-crud/utils/workflow-record-write-context.storage';

type DealEventBatch = WorkspaceEventBatch<
  ObjectRecordBaseEvent<Record<string, unknown>>
>;

// Listens to the ORM, so moves from the UI, API, board, bulk edit and workflows are all recorded.
// No UPSERTED handler: the ORM emits it next to every CREATED and UPDATED, which would record moves twice
@Injectable()
export class DealStageHistoryListener {
  constructor(
    @InjectMessageQueue(MessageQueue.workspaceQueue)
    private readonly messageQueueService: MessageQueueService,
    private readonly roboostLoadModeService: RoboostLoadModeService,
  ) {}

  @OnDatabaseBatchEvent('opportunity', DatabaseEventAction.CREATED)
  async handleCreated(batch: DealEventBatch) {
    await this.handleBatch(batch, false, 'opportunity');
  }

  @OnDatabaseBatchEvent('opportunity', DatabaseEventAction.UPDATED)
  async handleUpdated(batch: DealEventBatch) {
    await this.handleBatch(batch, true, 'opportunity');
  }

  @OnDatabaseBatchEvent('service', DatabaseEventAction.CREATED)
  async handleServiceCreated(batch: DealEventBatch) {
    await this.handleBatch(batch, false, 'service');
  }

  @OnDatabaseBatchEvent('service', DatabaseEventAction.UPDATED)
  async handleServiceUpdated(batch: DealEventBatch) {
    await this.handleBatch(batch, true, 'service');
  }

  private async handleBatch(
    batch: DealEventBatch,
    isUpdate: boolean,
    objectNameSingular: PipelineObjectNameSingular,
  ) {
    // A migration load writes the HubSpot dates and history itself
    if (await this.roboostLoadModeService.isOn(batch.workspaceId)) {
      return;
    }

    const changes = buildDealStageChanges({
      events: batch.events,
      isUpdate,
      isWorkflowWrite: isWorkflowRecordWrite(),
      // The write time stands for the move time, since the job may run a little later
      changedAt: new Date().toISOString(),
    });

    if (changes.length === 0) {
      return;
    }

    await this.messageQueueService.add<DealStageHistoryJobData>(
      DEAL_STAGE_HISTORY_JOB_NAME,
      { workspaceId: batch.workspaceId, changes, objectNameSingular },
    );
  }
}
