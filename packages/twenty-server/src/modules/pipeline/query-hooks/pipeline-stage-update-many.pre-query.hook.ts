import { type WorkspacePreQueryHookInstance } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/interfaces/workspace-query-hook.interface';
import { type UpdateManyResolverArgs } from 'src/engine/api/graphql/workspace-resolver-builder/interfaces/workspace-resolvers-builder.interface';

import { WorkspaceQueryHook } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/decorators/workspace-query-hook.decorator';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { PipelineWriteGuardService } from 'src/modules/pipeline/services/pipeline-write-guard.service';

@WorkspaceQueryHook(`pipelineStage.updateMany`)
export class PipelineStageUpdateManyPreQueryHook implements WorkspacePreQueryHookInstance {
  constructor(
    private readonly pipelineWriteGuardService: PipelineWriteGuardService,
  ) {}

  async execute(
    authContext: WorkspaceAuthContext,
    _objectName: string,
    payload: UpdateManyResolverArgs,
  ): Promise<UpdateManyResolverArgs> {
    return {
      ...payload,
      data: await this.pipelineWriteGuardService.preparePipelineStageUpdate(
        authContext,
        payload.data,
        { filter: payload.filter },
      ),
    };
  }
}
