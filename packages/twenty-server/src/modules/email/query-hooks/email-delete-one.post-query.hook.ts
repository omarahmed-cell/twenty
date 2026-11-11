import { Injectable } from '@nestjs/common';

import { type WorkspacePostQueryHookInstance } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/interfaces/workspace-query-hook.interface';

import { WorkspaceQueryHook } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/decorators/workspace-query-hook.decorator';
import { WorkspaceQueryHookType } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/types/workspace-query-hook.type';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { EmailPostQueryHookService } from 'src/modules/email/query-hooks/email-post-query-hook.service';
import { EmailWorkspaceEntity } from 'src/modules/email/standard-objects/email.workspace-entity';

@Injectable()
@WorkspaceQueryHook({
  key: `email.deleteOne`,
  type: WorkspaceQueryHookType.POST_HOOK,
})
export class EmailDeleteOnePostQueryHook implements WorkspacePostQueryHookInstance {
  constructor(
    private readonly emailPostQueryHookService: EmailPostQueryHookService,
  ) {}

  async execute(
    authContext: WorkspaceAuthContext,
    _objectName: string,
    payload: EmailWorkspaceEntity[],
  ): Promise<void> {
    await this.emailPostQueryHookService.handleEmailTargetsDelete(
      authContext,
      payload,
    );
  }
}
