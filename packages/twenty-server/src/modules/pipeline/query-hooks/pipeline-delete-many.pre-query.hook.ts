import { type WorkspacePreQueryHookInstance } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/interfaces/workspace-query-hook.interface';
import { type DeleteManyResolverArgs } from 'src/engine/api/graphql/workspace-resolver-builder/interfaces/workspace-resolvers-builder.interface';

import { WorkspaceQueryHook } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/decorators/workspace-query-hook.decorator';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { PipelineWriteGuardService } from 'src/modules/pipeline/services/pipeline-write-guard.service';

@WorkspaceQueryHook(`pipeline.deleteMany`)
export class PipelineDeleteManyPreQueryHook implements WorkspacePreQueryHookInstance {
  constructor(
    private readonly pipelineWriteGuardService: PipelineWriteGuardService,
  ) {}

  async execute(
    authContext: WorkspaceAuthContext,
    _objectName: string,
    payload: DeleteManyResolverArgs,
  ): Promise<DeleteManyResolverArgs> {
    await this.pipelineWriteGuardService.assertPipelinesRemovable(authContext, {
      filter: payload.filter,
    });

    return payload;
  }
}
