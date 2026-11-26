import { type WorkspacePreQueryHookInstance } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/interfaces/workspace-query-hook.interface';
import {
  type CreateManyResolverArgs,
  type CreateOneResolverArgs,
  type UpdateManyResolverArgs,
  type UpdateOneResolverArgs,
} from 'src/engine/api/graphql/workspace-resolver-builder/interfaces/workspace-resolvers-builder.interface';

import { WorkspaceQueryHook } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/decorators/workspace-query-hook.decorator';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { RoboostDealMoneyService } from 'src/modules/roboost-deal-money/services/roboost-deal-money.service';

@WorkspaceQueryHook(`opportunity.createOne`)
export class RoboostDealMoneyCreateOnePreQueryHook implements WorkspacePreQueryHookInstance {
  constructor(
    private readonly roboostDealMoneyService: RoboostDealMoneyService,
  ) {}

  async execute(
    authContext: WorkspaceAuthContext,
    _objectName: string,
    payload: CreateOneResolverArgs,
  ): Promise<CreateOneResolverArgs> {
    const [data] = await this.roboostDealMoneyService.prepareCreate(
      authContext,
      [payload.data],
    );

    return { ...payload, data };
  }
}

@WorkspaceQueryHook(`opportunity.createMany`)
export class RoboostDealMoneyCreateManyPreQueryHook implements WorkspacePreQueryHookInstance {
  constructor(
    private readonly roboostDealMoneyService: RoboostDealMoneyService,
  ) {}

  async execute(
    authContext: WorkspaceAuthContext,
    _objectName: string,
    payload: CreateManyResolverArgs,
  ): Promise<CreateManyResolverArgs> {
    return {
      ...payload,
      data: await this.roboostDealMoneyService.prepareCreate(
        authContext,
        payload.data,
      ),
    };
  }
}

@WorkspaceQueryHook(`opportunity.updateOne`)
export class RoboostDealMoneyUpdateOnePreQueryHook implements WorkspacePreQueryHookInstance {
  constructor(
    private readonly roboostDealMoneyService: RoboostDealMoneyService,
  ) {}

  async execute(
    authContext: WorkspaceAuthContext,
    _objectName: string,
    payload: UpdateOneResolverArgs,
  ): Promise<UpdateOneResolverArgs> {
    return {
      ...payload,
      data: await this.roboostDealMoneyService.prepareUpdate(
        authContext,
        [payload.id],
        payload.data,
      ),
    };
  }
}

@WorkspaceQueryHook(`opportunity.updateMany`)
export class RoboostDealMoneyUpdateManyPreQueryHook implements WorkspacePreQueryHookInstance {
  constructor(
    private readonly roboostDealMoneyService: RoboostDealMoneyService,
  ) {}

  async execute(
    authContext: WorkspaceAuthContext,
    _objectName: string,
    payload: UpdateManyResolverArgs,
  ): Promise<UpdateManyResolverArgs> {
    return {
      ...payload,
      data: await this.roboostDealMoneyService.prepareUpdate(
        authContext,
        [],
        payload.data,
      ),
    };
  }
}

export const ROBOOST_DEAL_MONEY_QUERY_HOOKS = [
  RoboostDealMoneyCreateOnePreQueryHook,
  RoboostDealMoneyCreateManyPreQueryHook,
  RoboostDealMoneyUpdateOnePreQueryHook,
  RoboostDealMoneyUpdateManyPreQueryHook,
];
