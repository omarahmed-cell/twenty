import { Injectable } from '@nestjs/common';

import { type ObjectRecordBaseEvent } from 'twenty-shared/database-events';

import { OnDatabaseBatchEvent } from 'src/engine/api/graphql/graphql-query-runner/decorators/on-database-batch-event.decorator';
import { DatabaseEventAction } from 'src/engine/api/graphql/graphql-query-runner/enums/database-event-action';
import { type WorkspaceEventBatch } from 'src/engine/workspace-event-emitter/types/workspace-event-batch.type';
import { RoboostProductPriceService } from 'src/modules/roboost-catalog/services/roboost-product-price.service';

type ProductEventBatch = WorkspaceEventBatch<
  ObjectRecordBaseEvent<Record<string, unknown>>
>;

// Margin follows every price or cost change, whoever writes it
@Injectable()
export class RoboostProductMarginListener {
  constructor(
    private readonly roboostProductPriceService: RoboostProductPriceService,
  ) {}

  @OnDatabaseBatchEvent('product', DatabaseEventAction.CREATED)
  async handleCreated(batch: ProductEventBatch) {
    await this.recompute(batch);
  }

  @OnDatabaseBatchEvent('product', DatabaseEventAction.UPDATED)
  async handleUpdated(batch: ProductEventBatch) {
    await this.recompute(batch);
  }

  @OnDatabaseBatchEvent('product', DatabaseEventAction.UPSERTED)
  async handleUpserted(batch: ProductEventBatch) {
    await this.recompute(batch);
  }

  private async recompute(batch: ProductEventBatch) {
    const productIds = batch.events.map((event) => event.recordId);

    if (productIds.length > 0) {
      await this.roboostProductPriceService.recomputeMargins(
        batch.workspaceId,
        productIds,
      );
    }
  }
}
