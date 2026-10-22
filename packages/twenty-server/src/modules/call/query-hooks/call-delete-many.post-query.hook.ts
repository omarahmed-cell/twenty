import { Injectable } from '@nestjs/common';

import { type WorkspacePostQueryHookInstance } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/interfaces/workspace-query-hook.interface';

import { WorkspaceQueryHook } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/decorators/workspace-query-hook.decorator';
import { WorkspaceQueryHookType } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/types/workspace-query-hook.type';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { CallPostQueryHookService } from 'src/modules/call/query-hooks/call-post-query-hook.service';
import { CallWorkspaceEntity } from 'src/modules/call/standard-objects/call.workspace-entity';

@Injectable()
@WorkspaceQueryHook({
  key: `call.deleteMany`,
  type: WorkspaceQueryHookType.POST_HOOK,
})
export class CallDeleteManyPostQueryHook implements WorkspacePostQueryHookInstance {
  constructor(
    private readonly callPostQueryHookService: CallPostQueryHookService,
  ) {}

  async execute(
    authContext: WorkspaceAuthContext,
    _objectName: string,
    payload: CallWorkspaceEntity[],
  ): Promise<void> {
    await this.callPostQueryHookService.handleCallTargetsDelete(
      authContext,
      payload,
    );
  }
}
