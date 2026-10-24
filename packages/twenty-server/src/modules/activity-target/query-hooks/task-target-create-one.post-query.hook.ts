import { Injectable } from '@nestjs/common';

import { type WorkspacePostQueryHookInstance } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/interfaces/workspace-query-hook.interface';

import { WorkspaceQueryHook } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/decorators/workspace-query-hook.decorator';
import { WorkspaceQueryHookType } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/types/workspace-query-hook.type';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { ActivityTargetCompanyCascadeService } from 'src/modules/activity-target/query-hooks/activity-target-company-cascade.service';

@Injectable()
@WorkspaceQueryHook({
  key: `taskTarget.createOne`,
  type: WorkspaceQueryHookType.POST_HOOK,
})
export class TaskTargetCreateOnePostQueryHook implements WorkspacePostQueryHookInstance {
  constructor(
    private readonly activityTargetCompanyCascadeService: ActivityTargetCompanyCascadeService,
  ) {}

  async execute(
    authContext: WorkspaceAuthContext,
    _objectName: string,
    payload: { id: string }[],
  ): Promise<void> {
    await this.activityTargetCompanyCascadeService.addParentCompanyTargets(
      authContext,
      { junctionObjectName: 'taskTarget', activityIdFieldName: 'taskId' },
      payload,
    );
  }
}
