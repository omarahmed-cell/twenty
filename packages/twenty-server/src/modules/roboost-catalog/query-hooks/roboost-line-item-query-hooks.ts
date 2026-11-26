import { type WorkspacePreQueryHookInstance } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/interfaces/workspace-query-hook.interface';
import {
  type CreateManyResolverArgs,
  type CreateOneResolverArgs,
  type UpdateOneResolverArgs,
} from 'src/engine/api/graphql/workspace-resolver-builder/interfaces/workspace-resolvers-builder.interface';

import { WorkspaceQueryHook } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/decorators/workspace-query-hook.decorator';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { RoboostLineItemService } from 'src/modules/roboost-catalog/services/roboost-line-item.service';

@WorkspaceQueryHook(`lineItem.createOne`)
export class RoboostLineItemCreateOnePreQueryHook implements WorkspacePreQueryHookInstance {
  constructor(
    private readonly roboostLineItemService: RoboostLineItemService,
  ) {}

  async execute(
    authContext: WorkspaceAuthContext,
    _objectName: string,
    payload: CreateOneResolverArgs,
  ): Promise<CreateOneResolverArgs> {
    await this.roboostLineItemService.assertCreate(authContext.workspace.id, [
      payload.data,
    ]);

    return payload;
  }
}

@WorkspaceQueryHook(`lineItem.createMany`)
export class RoboostLineItemCreateManyPreQueryHook implements WorkspacePreQueryHookInstance {
  constructor(
    private readonly roboostLineItemService: RoboostLineItemService,
  ) {}

  async execute(
    authContext: WorkspaceAuthContext,
    _objectName: string,
    payload: CreateManyResolverArgs,
  ): Promise<CreateManyResolverArgs> {
    await this.roboostLineItemService.assertCreate(
      authContext.workspace.id,
      payload.data,
    );

    return payload;
  }
}

@WorkspaceQueryHook(`lineItem.updateOne`)
export class RoboostLineItemUpdateOnePreQueryHook implements WorkspacePreQueryHookInstance {
  constructor(
    private readonly roboostLineItemService: RoboostLineItemService,
  ) {}

  async execute(
    authContext: WorkspaceAuthContext,
    _objectName: string,
    payload: UpdateOneResolverArgs,
  ): Promise<UpdateOneResolverArgs> {
    if ('productId' in payload.data) {
      await this.roboostLineItemService.assertActiveProducts(
        authContext.workspace.id,
        [payload.data.productId],
      );
    }

    return payload;
  }
}

export const ROBOOST_LINE_ITEM_QUERY_HOOKS = [
  RoboostLineItemCreateOnePreQueryHook,
  RoboostLineItemCreateManyPreQueryHook,
  RoboostLineItemUpdateOnePreQueryHook,
];
