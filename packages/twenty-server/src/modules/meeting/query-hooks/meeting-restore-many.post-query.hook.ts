import { Injectable } from '@nestjs/common';

import { type WorkspacePostQueryHookInstance } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/interfaces/workspace-query-hook.interface';

import { WorkspaceQueryHook } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/decorators/workspace-query-hook.decorator';
import { WorkspaceQueryHookType } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/types/workspace-query-hook.type';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { MeetingPostQueryHookService } from 'src/modules/meeting/query-hooks/meeting-post-query-hook.service';
import { MeetingWorkspaceEntity } from 'src/modules/meeting/standard-objects/meeting.workspace-entity';

@Injectable()
@WorkspaceQueryHook({
  key: `meeting.restoreMany`,
  type: WorkspaceQueryHookType.POST_HOOK,
})
export class MeetingRestoreManyPostQueryHook implements WorkspacePostQueryHookInstance {
  constructor(
    private readonly meetingPostQueryHookService: MeetingPostQueryHookService,
  ) {}

  async execute(
    authContext: WorkspaceAuthContext,
    _objectName: string,
    payload: MeetingWorkspaceEntity[],
  ): Promise<void> {
    await this.meetingPostQueryHookService.handleMeetingTargetsRestore(
      authContext,
      payload,
    );
  }
}
