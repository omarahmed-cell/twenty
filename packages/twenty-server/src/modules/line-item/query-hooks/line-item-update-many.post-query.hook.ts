import { Injectable } from '@nestjs/common';

import { type WorkspacePostQueryHookInstance } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/interfaces/workspace-query-hook.interface';

import { WorkspaceQueryHook } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/decorators/workspace-query-hook.decorator';
import { WorkspaceQueryHookType } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/types/workspace-query-hook.type';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { LineItemPricingService } from 'src/modules/line-item/query-hooks/line-item-pricing.service';

@Injectable()
@WorkspaceQueryHook({
  key: `lineItem.updateMany`,
  type: WorkspaceQueryHookType.POST_HOOK,
})
export class LineItemUpdateManyPostQueryHook implements WorkspacePostQueryHookInstance {
  constructor(
    private readonly lineItemPricingService: LineItemPricingService,
  ) {}

  async execute(
    authContext: WorkspaceAuthContext,
    _objectName: string,
    payload: { id: string }[],
  ): Promise<void> {
    await this.lineItemPricingService.recomputeTotals(
      authContext,
      payload.map((lineItem) => lineItem.id),
    );
  }
}
