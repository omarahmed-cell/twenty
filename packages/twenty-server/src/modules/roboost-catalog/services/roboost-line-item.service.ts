import {
  BadRequestException,
  Injectable,
  type OnModuleInit,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';

import { isDefined } from 'twenty-shared/utils';
import { DataSource } from 'typeorm';

import { getWorkspaceSchemaName } from 'src/engine/workspace-datasource/utils/get-workspace-schema-name.util';
import { buildLineItemTotalsQuery } from 'src/modules/roboost-catalog/utils/build-line-item-totals-query.util';
import { RoboostCurrencyHooksService } from 'src/modules/roboost-currency/services/roboost-currency-hooks.service';

// Line item totals and the rule that inactive products can't be added
@Injectable()
export class RoboostLineItemService implements OnModuleInit {
  constructor(
    @InjectDataSource()
    private readonly coreDataSource: DataSource,
    private readonly roboostCurrencyHooksService: RoboostCurrencyHooksService,
  ) {}

  onModuleInit() {
    // Quote lines with no deal follow the latest rates directly
    this.roboostCurrencyHooksService.onRatesChanged((workspaceId) =>
      this.recompute(workspaceId, 'all', []),
    );
  }

  async recompute(
    workspaceId: string,
    scope: 'lineItems' | 'deals' | 'all',
    ids: string[],
  ) {
    if (scope !== 'all' && ids.length === 0) {
      return;
    }
    await this.coreDataSource.query(
      buildLineItemTotalsQuery(getWorkspaceSchemaName(workspaceId), scope),
      scope === 'all' ? [] : [ids],
    );
  }

  async assertActiveProducts(workspaceId: string, productIds: unknown[]) {
    const ids = productIds.filter(
      (id): id is string => typeof id === 'string' && id !== '',
    );

    if (ids.length === 0) {
      return;
    }
    const inactive: { name: string | null }[] = await this.coreDataSource.query(
      `SELECT name FROM "${getWorkspaceSchemaName(workspaceId)}"."product"
      WHERE id = ANY($1::uuid[]) AND ("isActive" = false OR "deletedAt" IS NOT NULL)`,
      [ids],
    );

    if (inactive.length > 0) {
      throw new BadRequestException(
        `${inactive.map(({ name }) => name ?? 'This product').join(', ')} is inactive and can't be added to a deal`,
      );
    }
  }

  assertCreate(workspaceId: string, records: Record<string, unknown>[]) {
    return this.assertActiveProducts(
      workspaceId,
      records.map(({ productId }) => productId).filter(isDefined),
    );
  }
}
