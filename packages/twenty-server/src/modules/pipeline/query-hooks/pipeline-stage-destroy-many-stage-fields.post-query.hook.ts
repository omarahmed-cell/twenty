import { Injectable } from '@nestjs/common';

import { type WorkspacePostQueryHookInstance } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/interfaces/workspace-query-hook.interface';

import { WorkspaceQueryHook } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/decorators/workspace-query-hook.decorator';
import { WorkspaceQueryHookType } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/types/workspace-query-hook.type';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { DealStageCalculatedPropertiesService } from 'src/modules/pipeline/services/deal-stage-calculated-properties.service';

@Injectable()
@WorkspaceQueryHook({
  key: `pipelineStage.destroyMany`,
  type: WorkspaceQueryHookType.POST_HOOK,
})
export class PipelineStageDestroyManyStageFieldsPostQueryHook implements WorkspacePostQueryHookInstance {
  constructor(
    private readonly dealStageCalculatedPropertiesService: DealStageCalculatedPropertiesService,
  ) {}

  async execute(authContext: WorkspaceAuthContext): Promise<void> {
    await this.dealStageCalculatedPropertiesService.syncFields(
      authContext.workspace.id,
    );
  }
}
