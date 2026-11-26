import { Injectable } from '@nestjs/common';

import { type ObjectRecordBaseEvent } from 'twenty-shared/database-events';

import { OnDatabaseBatchEvent } from 'src/engine/api/graphql/graphql-query-runner/decorators/on-database-batch-event.decorator';
import { DatabaseEventAction } from 'src/engine/api/graphql/graphql-query-runner/enums/database-event-action';
import { type WorkspaceEventBatch } from 'src/engine/workspace-event-emitter/types/workspace-event-batch.type';
import { RoboostLineItemService } from 'src/modules/roboost-catalog/services/roboost-line-item.service';

type EventBatch = WorkspaceEventBatch<
  ObjectRecordBaseEvent<Record<string, unknown>>
>;

// A line item edit, or a deal's currency or amount change, refreshes the line totals
@Injectable()
export class RoboostLineItemTotalsListener {
  constructor(
    private readonly roboostLineItemService: RoboostLineItemService,
  ) {}

  @OnDatabaseBatchEvent('lineItem', DatabaseEventAction.CREATED)
  async handleLineItemCreated(batch: EventBatch) {
    await this.recomputeLineItems(batch);
  }

  @OnDatabaseBatchEvent('lineItem', DatabaseEventAction.UPDATED)
  async handleLineItemUpdated(batch: EventBatch) {
    await this.recomputeLineItems(batch);
  }

  @OnDatabaseBatchEvent('lineItem', DatabaseEventAction.UPSERTED)
  async handleLineItemUpserted(batch: EventBatch) {
    await this.recomputeLineItems(batch);
  }

  @OnDatabaseBatchEvent('opportunity', DatabaseEventAction.UPDATED)
  async handleDealUpdated(batch: EventBatch) {
    await this.roboostLineItemService.recompute(
      batch.workspaceId,
      'deals',
      batch.events.map((event) => event.recordId),
    );
  }

  private async recomputeLineItems(batch: EventBatch) {
    await this.roboostLineItemService.recompute(
      batch.workspaceId,
      'lineItems',
      batch.events.map((event) => event.recordId),
    );
  }
}
