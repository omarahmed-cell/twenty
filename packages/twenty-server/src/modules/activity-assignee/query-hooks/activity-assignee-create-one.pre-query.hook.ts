import { type WorkspacePreQueryHookInstance } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/interfaces/workspace-query-hook.interface';
import { type CreateOneResolverArgs } from 'src/engine/api/graphql/workspace-resolver-builder/interfaces/workspace-resolvers-builder.interface';

import { WorkspaceQueryHook } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/decorators/workspace-query-hook.decorator';
import { type RecordInput } from 'src/engine/core-modules/actor/services/actor-from-auth-context.service';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { defaultActivityAssignee } from 'src/modules/activity-assignee/query-hooks/utils/default-activity-assignee.util';

@WorkspaceQueryHook('*.createOne')
export class ActivityAssigneeCreateOnePreQueryHook implements WorkspacePreQueryHookInstance {
  async execute(
    authContext: WorkspaceAuthContext,
    objectName: string,
    payload: CreateOneResolverArgs<RecordInput>,
  ): Promise<CreateOneResolverArgs<RecordInput>> {
    const [data] = defaultActivityAssignee({
      authContext,
      objectName,
      records: [payload.data],
    });

    return { ...payload, data };
  }
}
