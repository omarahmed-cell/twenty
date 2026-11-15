import { Injectable } from '@nestjs/common';

import { type ObjectRecordBaseEvent } from 'twenty-shared/database-events';

import { OnDatabaseBatchEvent } from 'src/engine/api/graphql/graphql-query-runner/decorators/on-database-batch-event.decorator';
import { DatabaseEventAction } from 'src/engine/api/graphql/graphql-query-runner/enums/database-event-action';
import { type WorkspaceEventBatch } from 'src/engine/workspace-event-emitter/types/workspace-event-batch.type';
import { isImportWrite } from 'src/modules/assigned-date-tracking/utils/is-import-write.util';
import { PersonCalculationQueueService } from 'src/modules/person-calculated-fields/services/person-calculation-queue.service';
import {
  PERSON_CALCULATION_WATCHED_OBJECT_NAMES,
  collectPersonCalculationReferences,
} from 'src/modules/person-calculated-fields/utils/collect-person-calculation-references.util';

type PersonCalculationEventBatch = WorkspaceEventBatch<
  ObjectRecordBaseEvent<Record<string, unknown>>
>;

// Listens to the ORM, so UI, API, workflow and import writes all reach it
@Injectable()
export class PersonCalculatedFieldsListener {
  constructor(
    private readonly personCalculationQueueService: PersonCalculationQueueService,
  ) {}

  @OnDatabaseBatchEvent('*', DatabaseEventAction.CREATED)
  async handleCreated(batch: PersonCalculationEventBatch) {
    await this.handleBatch(batch, false);
  }

  @OnDatabaseBatchEvent('*', DatabaseEventAction.UPDATED)
  async handleUpdated(batch: PersonCalculationEventBatch) {
    await this.handleBatch(batch, true);
  }

  @OnDatabaseBatchEvent('*', DatabaseEventAction.UPSERTED)
  async handleUpserted(batch: PersonCalculationEventBatch) {
    await this.handleBatch(batch, true);
  }

  @OnDatabaseBatchEvent('*', DatabaseEventAction.DELETED)
  async handleDeleted(batch: PersonCalculationEventBatch) {
    await this.handleBatch(batch, false);
  }

  @OnDatabaseBatchEvent('*', DatabaseEventAction.RESTORED)
  async handleRestored(batch: PersonCalculationEventBatch) {
    await this.handleBatch(batch, false);
  }

  @OnDatabaseBatchEvent('*', DatabaseEventAction.DESTROYED)
  async handleDestroyed(batch: PersonCalculationEventBatch) {
    await this.handleBatch(batch, false);
  }

  private async handleBatch(
    batch: PersonCalculationEventBatch,
    isUpdate: boolean,
  ) {
    const objectNameSingular = batch.objectMetadata?.nameSingular;

    if (!PERSON_CALCULATION_WATCHED_OBJECT_NAMES.has(objectNameSingular)) {
      return;
    }

    const references = batch.events.flatMap((event) =>
      collectPersonCalculationReferences({
        objectNameSingular,
        isUpdate,
        before: event.properties?.before,
        after: event.properties?.after,
      }),
    );

    await this.personCalculationQueueService.enqueueReferences({
      workspaceId: batch.workspaceId,
      references,
      isImport: batch.events.some((event) =>
        isImportWrite(event.properties?.after, isUpdate),
      ),
    });
  }
}
