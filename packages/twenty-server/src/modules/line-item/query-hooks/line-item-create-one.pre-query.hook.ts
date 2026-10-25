import { Injectable } from '@nestjs/common';

import { type WorkspacePreQueryHookInstance } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/interfaces/workspace-query-hook.interface';
import { type CreateOneResolverArgs } from 'src/engine/api/graphql/workspace-resolver-builder/interfaces/workspace-resolvers-builder.interface';

import { WorkspaceQueryHook } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/decorators/workspace-query-hook.decorator';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { LineItemPricingService } from 'src/modules/line-item/query-hooks/line-item-pricing.service';
import { type LineItemPricingFields } from 'src/modules/line-item/utils/compute-line-item-derived-fields.util';

@Injectable()
@WorkspaceQueryHook(`lineItem.createOne`)
export class LineItemCreateOnePreQueryHook implements WorkspacePreQueryHookInstance {
  constructor(
    private readonly lineItemPricingService: LineItemPricingService,
  ) {}

  async execute(
    authContext: WorkspaceAuthContext,
    _objectName: string,
    payload: CreateOneResolverArgs<LineItemPricingFields>,
  ): Promise<CreateOneResolverArgs<LineItemPricingFields>> {
    await this.lineItemPricingService.applyToCreateInputs(authContext, [
      payload.data,
    ]);

    return payload;
  }
}
