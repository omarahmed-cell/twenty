import { type WorkspacePreQueryHookInstance } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/interfaces/workspace-query-hook.interface';
import { type RestoreManyResolverArgs } from 'src/engine/api/graphql/workspace-resolver-builder/interfaces/workspace-resolvers-builder.interface';

import { WorkspaceQueryHook } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/decorators/workspace-query-hook.decorator';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { PipelineWriteGuardService } from 'src/modules/pipeline/services/pipeline-write-guard.service';

@WorkspaceQueryHook(`pipeline.restoreMany`)
export class PipelineRestoreManyPreQueryHook implements WorkspacePreQueryHookInstance {
  constructor(
    private readonly pipelineWriteGuardService: PipelineWriteGuardService,
  ) {}

  async execute(
    authContext: WorkspaceAuthContext,
    _objectName: string,
    payload: RestoreManyResolverArgs,
  ): Promise<RestoreManyResolverArgs> {
    await this.pipelineWriteGuardService.assertCanEdit(authContext);

    return payload;
  }
}
