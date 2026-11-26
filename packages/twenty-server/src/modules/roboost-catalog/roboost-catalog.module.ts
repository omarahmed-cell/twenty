import { Module } from '@nestjs/common';

import { FieldMetadataModule } from 'src/engine/metadata-modules/field-metadata/field-metadata.module';
import { WorkspaceManyOrAllFlatEntityMapsCacheModule } from 'src/engine/metadata-modules/flat-entity/services/workspace-many-or-all-flat-entity-maps-cache.module';
import { ROBOOST_CATALOG_LISTENERS } from 'src/modules/roboost-catalog/listeners/roboost-catalog-listeners.constant';
import { ROBOOST_LINE_ITEM_QUERY_HOOKS } from 'src/modules/roboost-catalog/query-hooks/roboost-line-item-query-hooks';
import { RoboostLineItemService } from 'src/modules/roboost-catalog/services/roboost-line-item.service';
import { ROBOOST_PRODUCT_QUERY_HOOKS } from 'src/modules/roboost-catalog/query-hooks/roboost-product-query-hooks';
import { RoboostProductPriceService } from 'src/modules/roboost-catalog/services/roboost-product-price.service';
import { RoboostCurrencyModule } from 'src/modules/roboost-currency/roboost-currency.module';

@Module({
  imports: [
    FieldMetadataModule,
    WorkspaceManyOrAllFlatEntityMapsCacheModule,
    RoboostCurrencyModule,
  ],
  providers: [
    RoboostProductPriceService,
    RoboostLineItemService,
    ...ROBOOST_CATALOG_LISTENERS,
    ...ROBOOST_LINE_ITEM_QUERY_HOOKS,
    ...ROBOOST_PRODUCT_QUERY_HOOKS,
  ],
  exports: [RoboostProductPriceService, RoboostLineItemService],
})
export class RoboostCatalogModule {}
