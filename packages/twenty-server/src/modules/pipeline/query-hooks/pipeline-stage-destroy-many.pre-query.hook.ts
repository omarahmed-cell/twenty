import { type WorkspacePreQueryHookInstance } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/interfaces/workspace-query-hook.interface';
import { type DestroyManyResolverArgs } from 'src/engine/api/graphql/workspace-resolver-builder/interfaces/workspace-resolvers-builder.interface';

import { WorkspaceQueryHook } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/decorators/workspace-query-hook.decorator';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { PipelineWriteGuardService } from 'src/modules/pipeline/services/pipeline-write-guard.service';

@WorkspaceQueryHook(`pipelineStage.destroyMany`)
export class PipelineStageDestroyManyPreQueryHook implements WorkspacePreQueryHookInstance {
  constructor(
    private readonly pipelineWriteGuardService: PipelineWriteGuardService,
  ) {}

  async execute(
    authContext: WorkspaceAuthContext,
    _objectName: string,
    payload: DestroyManyResolverArgs,
  ): Promise<DestroyManyResolverArgs> {
    await this.pipelineWriteGuardService.assertPipelineStagesRemovable(
      authContext,
      {
        filter: payload.filter,
      },
    );

    return payload;
  }
}
