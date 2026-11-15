import { Injectable } from '@nestjs/common';

import { type ObjectRecordBaseEvent } from 'twenty-shared/database-events';

import { OnDatabaseBatchEvent } from 'src/engine/api/graphql/graphql-query-runner/decorators/on-database-batch-event.decorator';
import { DatabaseEventAction } from 'src/engine/api/graphql/graphql-query-runner/enums/database-event-action';
import { type WorkspaceEventBatch } from 'src/engine/workspace-event-emitter/types/workspace-event-batch.type';
import { isImportWrite } from 'src/modules/assigned-date-tracking/utils/is-import-write.util';
import { CompanyCalculationQueueService } from 'src/modules/company-calculated-fields/services/company-calculation-queue.service';
import {
  COMPANY_CALCULATION_WATCHED_OBJECT_NAMES,
  collectCompanyCalculationReferences,
} from 'src/modules/company-calculated-fields/utils/collect-company-calculation-references.util';

type CompanyCalculationEventBatch = WorkspaceEventBatch<
  ObjectRecordBaseEvent<Record<string, unknown>>
>;

// Listens to the ORM, so UI, API, workflow and import writes all reach it
@Injectable()
export class CompanyCalculatedFieldsListener {
  constructor(
    private readonly companyCalculationQueueService: CompanyCalculationQueueService,
  ) {}

  @OnDatabaseBatchEvent('*', DatabaseEventAction.CREATED)
  async handleCreated(batch: CompanyCalculationEventBatch) {
    await this.handleBatch(batch, false);
  }

  @OnDatabaseBatchEvent('*', DatabaseEventAction.UPDATED)
  async handleUpdated(batch: CompanyCalculationEventBatch) {
    await this.handleBatch(batch, true);
  }

  @OnDatabaseBatchEvent('*', DatabaseEventAction.UPSERTED)
  async handleUpserted(batch: CompanyCalculationEventBatch) {
    await this.handleBatch(batch, true);
  }

  @OnDatabaseBatchEvent('*', DatabaseEventAction.DELETED)
  async handleDeleted(batch: CompanyCalculationEventBatch) {
    await this.handleBatch(batch, false);
  }

  @OnDatabaseBatchEvent('*', DatabaseEventAction.RESTORED)
  async handleRestored(batch: CompanyCalculationEventBatch) {
    await this.handleBatch(batch, false);
  }

  @OnDatabaseBatchEvent('*', DatabaseEventAction.DESTROYED)
  async handleDestroyed(batch: CompanyCalculationEventBatch) {
    await this.handleBatch(batch, false);
  }

  private async handleBatch(
    batch: CompanyCalculationEventBatch,
    isUpdate: boolean,
  ) {
    const objectNameSingular = batch.objectMetadata?.nameSingular;

    if (!COMPANY_CALCULATION_WATCHED_OBJECT_NAMES.has(objectNameSingular)) {
      return;
    }

    const references = batch.events.flatMap((event) =>
      collectCompanyCalculationReferences({
        objectNameSingular,
        isUpdate,
        before: event.properties?.before,
        after: event.properties?.after,
      }),
    );

    await this.companyCalculationQueueService.enqueueReferences({
      workspaceId: batch.workspaceId,
      references,
      isImport: batch.events.some((event) =>
        isImportWrite(event.properties?.after, isUpdate),
      ),
    });
  }
}
