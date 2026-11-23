import { type WorkspacePreQueryHookInstance } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/interfaces/workspace-query-hook.interface';
import { type CreateManyResolverArgs } from 'src/engine/api/graphql/workspace-resolver-builder/interfaces/workspace-resolvers-builder.interface';

import { WorkspaceQueryHook } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/decorators/workspace-query-hook.decorator';
import { type RecordInput } from 'src/engine/core-modules/actor/services/actor-from-auth-context.service';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { syncMeetingAssigneeWithHost } from 'src/modules/meeting/utils/sync-meeting-assignee-with-host.util';

@WorkspaceQueryHook('meeting.createMany')
export class MeetingCreateManyPreQueryHook implements WorkspacePreQueryHookInstance {
  async execute(
    _authContext: WorkspaceAuthContext,
    _objectName: string,
    payload: CreateManyResolverArgs<RecordInput>,
  ): Promise<CreateManyResolverArgs<RecordInput>> {
    return {
      ...payload,
      data: payload.data.map(syncMeetingAssigneeWithHost),
    };
  }
}
