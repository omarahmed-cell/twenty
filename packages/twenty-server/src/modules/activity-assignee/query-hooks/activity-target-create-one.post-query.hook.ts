import { Injectable } from '@nestjs/common';

import { type WorkspacePostQueryHookInstance } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/interfaces/workspace-query-hook.interface';

import { WorkspaceQueryHook } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/decorators/workspace-query-hook.decorator';
import { WorkspaceQueryHookType } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/types/workspace-query-hook.type';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import {
  getActivityObjectOfJunction,
  WorkflowActivityOwnerAssigneeService,
} from 'src/modules/activity-assignee/services/workflow-activity-owner-assignee.service';

@Injectable()
@WorkspaceQueryHook({
  key: '*.createOne',
  type: WorkspaceQueryHookType.POST_HOOK,
})
export class ActivityTargetCreateOnePostQueryHook implements WorkspacePostQueryHookInstance {
  constructor(
    private readonly workflowActivityOwnerAssigneeService: WorkflowActivityOwnerAssigneeService,
  ) {}

  async execute(
    authContext: WorkspaceAuthContext,
    objectName: string,
    payload: unknown,
  ): Promise<void> {
    if (getActivityObjectOfJunction(objectName) === undefined) {
      return;
    }

    const records = (Array.isArray(payload) ? payload : [payload]) as {
      id?: unknown;
    }[];

    await this.workflowActivityOwnerAssigneeService.assignFromLinkedRecordOwner(
      {
        workspaceId: authContext.workspace.id,
        junctionObjectName: objectName,
        junctionIds: records
          .map((record) => record?.id)
          .filter((id): id is string => typeof id === 'string'),
      },
    );
  }
}
