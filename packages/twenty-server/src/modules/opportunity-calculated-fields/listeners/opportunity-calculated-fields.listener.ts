import { Injectable } from '@nestjs/common';

import { type ObjectRecordBaseEvent } from 'twenty-shared/database-events';

import { OnDatabaseBatchEvent } from 'src/engine/api/graphql/graphql-query-runner/decorators/on-database-batch-event.decorator';
import { DatabaseEventAction } from 'src/engine/api/graphql/graphql-query-runner/enums/database-event-action';
import { type WorkspaceEventBatch } from 'src/engine/workspace-event-emitter/types/workspace-event-batch.type';
import { isImportWrite } from 'src/modules/assigned-date-tracking/utils/is-import-write.util';
import { OpportunityCalculationQueueService } from 'src/modules/opportunity-calculated-fields/services/opportunity-calculation-queue.service';
import {
  OPPORTUNITY_CALCULATION_WATCHED_OBJECT_NAMES,
  collectOpportunityCalculationReferences,
} from 'src/modules/opportunity-calculated-fields/utils/collect-opportunity-calculation-references.util';

type OpportunityCalculationEventBatch = WorkspaceEventBatch<
  ObjectRecordBaseEvent<Record<string, unknown>>
>;

// Listens to the ORM, so UI, API, workflow and import writes all reach it
@Injectable()
export class OpportunityCalculatedFieldsListener {
  constructor(
    private readonly opportunityCalculationQueueService: OpportunityCalculationQueueService,
  ) {}

  @OnDatabaseBatchEvent('*', DatabaseEventAction.CREATED)
  async handleCreated(batch: OpportunityCalculationEventBatch) {
    await this.handleBatch(batch, false);
  }

  @OnDatabaseBatchEvent('*', DatabaseEventAction.UPDATED)
  async handleUpdated(batch: OpportunityCalculationEventBatch) {
    await this.handleBatch(batch, true);
  }

  @OnDatabaseBatchEvent('*', DatabaseEventAction.UPSERTED)
  async handleUpserted(batch: OpportunityCalculationEventBatch) {
    await this.handleBatch(batch, true);
  }

  @OnDatabaseBatchEvent('*', DatabaseEventAction.DELETED)
  async handleDeleted(batch: OpportunityCalculationEventBatch) {
    await this.handleBatch(batch, false);
  }

  @OnDatabaseBatchEvent('*', DatabaseEventAction.RESTORED)
  async handleRestored(batch: OpportunityCalculationEventBatch) {
    await this.handleBatch(batch, false);
  }

  @OnDatabaseBatchEvent('*', DatabaseEventAction.DESTROYED)
  async handleDestroyed(batch: OpportunityCalculationEventBatch) {
    await this.handleBatch(batch, false);
  }

  private async handleBatch(
    batch: OpportunityCalculationEventBatch,
    isUpdate: boolean,
  ) {
    const objectNameSingular = batch.objectMetadata?.nameSingular;

    if (!OPPORTUNITY_CALCULATION_WATCHED_OBJECT_NAMES.has(objectNameSingular)) {
      return;
    }

    const references = batch.events.flatMap((event) =>
      collectOpportunityCalculationReferences({
        objectNameSingular,
        isUpdate,
        before: event.properties?.before,
        after: event.properties?.after,
      }),
    );

    await this.opportunityCalculationQueueService.enqueueReferences({
      workspaceId: batch.workspaceId,
      references,
      isImport: batch.events.some((event) =>
        isImportWrite(event.properties?.after, isUpdate),
      ),
    });
  }
}
