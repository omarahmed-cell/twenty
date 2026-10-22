import { Injectable } from '@nestjs/common';

import { type WorkspacePostQueryHookInstance } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/interfaces/workspace-query-hook.interface';

import { WorkspaceQueryHook } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/decorators/workspace-query-hook.decorator';
import { WorkspaceQueryHookType } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/types/workspace-query-hook.type';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { CommunicationPostQueryHookService } from 'src/modules/communication/query-hooks/communication-post-query-hook.service';
import { CommunicationWorkspaceEntity } from 'src/modules/communication/standard-objects/communication.workspace-entity';

@Injectable()
@WorkspaceQueryHook({
  key: `communication.restoreOne`,
  type: WorkspaceQueryHookType.POST_HOOK,
})
export class CommunicationRestoreOnePostQueryHook implements WorkspacePostQueryHookInstance {
  constructor(
    private readonly communicationPostQueryHookService: CommunicationPostQueryHookService,
  ) {}

  async execute(
    authContext: WorkspaceAuthContext,
    _objectName: string,
    payload: CommunicationWorkspaceEntity[],
  ): Promise<void> {
    await this.communicationPostQueryHookService.handleCommunicationTargetsRestore(
      authContext,
      payload,
    );
  }
}
