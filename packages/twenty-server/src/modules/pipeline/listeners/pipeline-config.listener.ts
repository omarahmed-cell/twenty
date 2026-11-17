import { Injectable } from '@nestjs/common';

import { isNonEmptyString } from '@sniptt/guards';
import { type ObjectRecordBaseEvent } from 'twenty-shared/database-events';
import {
  isPipelineObjectNameSingular,
  type PipelineObjectNameSingular,
} from 'twenty-shared/utils';

import { OnDatabaseBatchEvent } from 'src/engine/api/graphql/graphql-query-runner/decorators/on-database-batch-event.decorator';
import { DatabaseEventAction } from 'src/engine/api/graphql/graphql-query-runner/enums/database-event-action';
import { InjectMessageQueue } from 'src/engine/core-modules/message-queue/decorators/message-queue.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';
import { type WorkspaceEventBatch } from 'src/engine/workspace-event-emitter/types/workspace-event-batch.type';
import { CompanyCalculationQueueService } from 'src/modules/company-calculated-fields/services/company-calculation-queue.service';
import { OpportunityCalculationQueueService } from 'src/modules/opportunity-calculated-fields/services/opportunity-calculation-queue.service';
import { PIPELINE_SYNC_JOB_NAME } from 'src/modules/pipeline/constants/pipeline-job-names.constant';
import { type PipelineSyncJobData } from 'src/modules/pipeline/jobs/pipeline-sync.job';

type PipelineEventBatch = WorkspaceEventBatch<
  ObjectRecordBaseEvent<Record<string, unknown>>
>;

const PIPELINE_CONFIG_OBJECT_NAMES = new Set(['pipeline', 'pipelineStage']);
// Several Settings edits in a row share one sync
const SYNC_DELAY_MILLISECONDS = 1_000;

@Injectable()
export class PipelineConfigListener {
  constructor(
    @InjectMessageQueue(MessageQueue.workspaceQueue)
    private readonly messageQueueService: MessageQueueService,
    private readonly opportunityCalculationQueueService: OpportunityCalculationQueueService,
    private readonly companyCalculationQueueService: CompanyCalculationQueueService,
  ) {}

  @OnDatabaseBatchEvent('*', DatabaseEventAction.CREATED)
  async handleCreated(batch: PipelineEventBatch) {
    await this.handleBatch(batch, false);
  }

  @OnDatabaseBatchEvent('*', DatabaseEventAction.UPDATED)
  async handleUpdated(batch: PipelineEventBatch) {
    await this.handleBatch(batch, true);
  }

  @OnDatabaseBatchEvent('*', DatabaseEventAction.UPSERTED)
  async handleUpserted(batch: PipelineEventBatch) {
    await this.handleBatch(batch, true);
  }

  @OnDatabaseBatchEvent('*', DatabaseEventAction.DELETED)
  async handleDeleted(batch: PipelineEventBatch) {
    await this.handleBatch(batch, false);
  }

  @OnDatabaseBatchEvent('*', DatabaseEventAction.DESTROYED)
  async handleDestroyed(batch: PipelineEventBatch) {
    await this.handleBatch(batch, false);
  }

  @OnDatabaseBatchEvent('*', DatabaseEventAction.RESTORED)
  async handleRestored(batch: PipelineEventBatch) {
    await this.handleBatch(batch, false);
  }

  private async handleBatch(batch: PipelineEventBatch, isUpdate: boolean) {
    const objectNameSingular = batch.objectMetadata?.nameSingular;

    if (!PIPELINE_CONFIG_OBJECT_NAMES.has(objectNameSingular)) {
      return;
    }

    for (const pipelineObjectNameSingular of this.getSyncedObjectNames(batch)) {
      await this.messageQueueService.add<PipelineSyncJobData>(
        PIPELINE_SYNC_JOB_NAME,
        {
          workspaceId: batch.workspaceId,
          objectNameSingular: pipelineObjectNameSingular,
        },
        {
          delay: SYNC_DELAY_MILLISECONDS,
          deduplication: {
            id: `pipeline-sync-${batch.workspaceId}-${pipelineObjectNameSingular ?? 'all'}`,
            keepLastIfActive: true,
          },
        },
      );
    }

    if (objectNameSingular !== 'pipelineStage') {
      return;
    }

    const stageValues = batch.events
      .filter(
        (event) =>
          !isUpdate ||
          event.properties?.before?.probability !==
            event.properties?.after?.probability,
      )
      .flatMap((event) => [
        event.properties?.before?.value,
        event.properties?.after?.value,
      ])
      .filter(isNonEmptyString);

    const references = [...new Set(stageValues)].map(
      (stageValue) => `pipelineStage:${stageValue}`,
    );

    // Deals in the stage get new probability fields; their companies may gain or lose an open deal
    await this.opportunityCalculationQueueService.enqueueReferences({
      workspaceId: batch.workspaceId,
      references,
    });
    await this.companyCalculationQueueService.enqueueReferences({
      workspaceId: batch.workspaceId,
      references,
    });
  }

  // A stage event does not carry its pipeline's object, so it syncs every pipeline object
  private getSyncedObjectNames(
    batch: PipelineEventBatch,
  ): (PipelineObjectNameSingular | undefined)[] {
    if (batch.objectMetadata?.nameSingular !== 'pipeline') {
      return [undefined];
    }

    const objectNames = new Set(
      batch.events
        .flatMap((event) => [
          event.properties?.before?.objectNameSingular,
          event.properties?.after?.objectNameSingular,
        ])
        .filter((objectName): objectName is PipelineObjectNameSingular =>
          isPipelineObjectNameSingular(objectName as string | undefined),
        ),
    );

    return objectNames.size > 0 ? [...objectNames] : [undefined];
  }
}
