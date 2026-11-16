import { type WorkspacePreQueryHookInstance } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/interfaces/workspace-query-hook.interface';
import { type CreateManyResolverArgs } from 'src/engine/api/graphql/workspace-resolver-builder/interfaces/workspace-resolvers-builder.interface';

import { WorkspaceQueryHook } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/decorators/workspace-query-hook.decorator';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { DealPipelineIntegrityService } from 'src/modules/pipeline/services/deal-pipeline-integrity.service';

@WorkspaceQueryHook(`opportunity.createMany`)
export class OpportunityCreateManyPreQueryHook implements WorkspacePreQueryHookInstance {
  constructor(
    private readonly dealPipelineIntegrityService: DealPipelineIntegrityService,
  ) {}

  async execute(
    authContext: WorkspaceAuthContext,
    _objectName: string,
    payload: CreateManyResolverArgs,
  ): Promise<CreateManyResolverArgs> {
    return {
      ...payload,
      data: await this.dealPipelineIntegrityService.prepareDealsToCreate({
        workspaceId: authContext.workspace.id,
        records: payload.data,
        isUpsert: payload.upsert === true,
      }),
    };
  }
}
