import { type WorkspacePreQueryHookInstance } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/interfaces/workspace-query-hook.interface';
import {
  type CreateManyResolverArgs,
  type CreateOneResolverArgs,
} from 'src/engine/api/graphql/workspace-resolver-builder/interfaces/workspace-resolvers-builder.interface';

import { WorkspaceQueryHook } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/decorators/workspace-query-hook.decorator';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { RoboostProductPriceService } from 'src/modules/roboost-catalog/services/roboost-product-price.service';

@WorkspaceQueryHook(`product.createOne`)
export class RoboostProductCreateOnePreQueryHook implements WorkspacePreQueryHookInstance {
  constructor(
    private readonly roboostProductPriceService: RoboostProductPriceService,
  ) {}

  async execute(
    authContext: WorkspaceAuthContext,
    _objectName: string,
    payload: CreateOneResolverArgs,
  ): Promise<CreateOneResolverArgs> {
    await this.roboostProductPriceService.assertCompanyPrice(
      authContext.workspace.id,
      [payload.data],
    );

    return payload;
  }
}

@WorkspaceQueryHook(`product.createMany`)
export class RoboostProductCreateManyPreQueryHook implements WorkspacePreQueryHookInstance {
  constructor(
    private readonly roboostProductPriceService: RoboostProductPriceService,
  ) {}

  async execute(
    authContext: WorkspaceAuthContext,
    _objectName: string,
    payload: CreateManyResolverArgs,
  ): Promise<CreateManyResolverArgs> {
    await this.roboostProductPriceService.assertCompanyPrice(
      authContext.workspace.id,
      payload.data,
    );

    return payload;
  }
}

export const ROBOOST_PRODUCT_QUERY_HOOKS = [
  RoboostProductCreateOnePreQueryHook,
  RoboostProductCreateManyPreQueryHook,
];
