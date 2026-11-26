import { Module } from '@nestjs/common';

import { ApplicationModule } from 'src/engine/core-modules/application/application.module';
import { FieldMetadataModule } from 'src/engine/metadata-modules/field-metadata/field-metadata.module';
import { WorkspaceManyOrAllFlatEntityMapsCacheModule } from 'src/engine/metadata-modules/flat-entity/services/workspace-many-or-all-flat-entity-maps-cache.module';
import { OpportunityCalculatedFieldsModule } from 'src/modules/opportunity-calculated-fields/opportunity-calculated-fields.module';
import { RoboostCurrencyModule } from 'src/modules/roboost-currency/roboost-currency.module';
import { ROBOOST_DEAL_MONEY_QUERY_HOOKS } from 'src/modules/roboost-deal-money/query-hooks/roboost-deal-money-query-hooks';
import { RoboostDealMoneyService } from 'src/modules/roboost-deal-money/services/roboost-deal-money.service';

@Module({
  imports: [
    ApplicationModule,
    FieldMetadataModule,
    WorkspaceManyOrAllFlatEntityMapsCacheModule,
    OpportunityCalculatedFieldsModule,
    RoboostCurrencyModule,
  ],
  providers: [RoboostDealMoneyService, ...ROBOOST_DEAL_MONEY_QUERY_HOOKS],
  exports: [RoboostDealMoneyService],
})
export class RoboostDealMoneyModule {}
