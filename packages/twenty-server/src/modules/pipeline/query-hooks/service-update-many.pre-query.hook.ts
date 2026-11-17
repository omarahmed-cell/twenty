import { type WorkspacePreQueryHookInstance } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/interfaces/workspace-query-hook.interface';
import { type UpdateManyResolverArgs } from 'src/engine/api/graphql/workspace-resolver-builder/interfaces/workspace-resolvers-builder.interface';

import { WorkspaceQueryHook } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/decorators/workspace-query-hook.decorator';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { DealPipelineIntegrityService } from 'src/modules/pipeline/services/deal-pipeline-integrity.service';

@WorkspaceQueryHook(`service.updateMany`)
export class ServiceUpdateManyPreQueryHook implements WorkspacePreQueryHookInstance {
  constructor(
    private readonly dealPipelineIntegrityService: DealPipelineIntegrityService,
  ) {}

  async execute(
    authContext: WorkspaceAuthContext,
    _objectName: string,
    payload: UpdateManyResolverArgs,
  ): Promise<UpdateManyResolverArgs> {
    return {
      ...payload,
      data: await this.dealPipelineIntegrityService.prepareDealsUpdate({
        authContext,
        objectNameSingular: 'service',
        filter: payload.filter,
        data: payload.data,
      }),
    };
  }
}
