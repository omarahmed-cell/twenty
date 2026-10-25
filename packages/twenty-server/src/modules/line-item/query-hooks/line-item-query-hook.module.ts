import { Module } from '@nestjs/common';

import { LineItemCreateManyPreQueryHook } from 'src/modules/line-item/query-hooks/line-item-create-many.pre-query.hook';
import { LineItemCreateOnePreQueryHook } from 'src/modules/line-item/query-hooks/line-item-create-one.pre-query.hook';
import { LineItemPricingService } from 'src/modules/line-item/query-hooks/line-item-pricing.service';
import { LineItemUpdateManyPostQueryHook } from 'src/modules/line-item/query-hooks/line-item-update-many.post-query.hook';
import { LineItemUpdateOnePreQueryHook } from 'src/modules/line-item/query-hooks/line-item-update-one.pre-query.hook';

@Module({
  providers: [
    LineItemPricingService,
    LineItemCreateOnePreQueryHook,
    LineItemCreateManyPreQueryHook,
    LineItemUpdateOnePreQueryHook,
    LineItemUpdateManyPostQueryHook,
  ],
})
export class LineItemQueryHookModule {}
