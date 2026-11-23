import { Injectable } from '@nestjs/common';

import { assertIsDefinedOrThrow } from 'twenty-shared/utils';
import { In } from 'typeorm';

import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { WorkspaceNotFoundDefaultError } from 'src/engine/core-modules/workspace/workspace.exception';
import { WorkspaceOrmManager } from 'src/engine/twenty-orm/workspace-orm.manager';
import { MeetingTargetWorkspaceEntity } from 'src/modules/meeting/standard-objects/meeting-target.workspace-entity';
import { MeetingWorkspaceEntity } from 'src/modules/meeting/standard-objects/meeting.workspace-entity';

@Injectable()
export class MeetingPostQueryHookService {
  constructor(private readonly workspaceOrmManager: WorkspaceOrmManager) {}

  async handleMeetingTargetsDelete(
    authContext: WorkspaceAuthContext,
    payload: MeetingWorkspaceEntity[],
  ): Promise<void> {
    if (!payload || payload?.length === 0) {
      return;
    }

    const workspace = authContext.workspace;

    assertIsDefinedOrThrow(workspace, WorkspaceNotFoundDefaultError);

    await this.workspaceOrmManager.executeInWorkspaceContext(async () => {
      const meetingTargetRepository =
        this.workspaceOrmManager.getRepository<MeetingTargetWorkspaceEntity>(
          'meetingTarget',
          { shouldBypassPermissionChecks: true },
        );

      await meetingTargetRepository.softDelete({
        meetingId: In(payload.map((meeting) => meeting.id)),
      });
    }, authContext);
  }

  async handleMeetingTargetsRestore(
    authContext: WorkspaceAuthContext,
    payload: MeetingWorkspaceEntity[],
  ): Promise<void> {
    if (!payload || payload?.length === 0) {
      return;
    }

    const workspace = authContext.workspace;

    assertIsDefinedOrThrow(workspace, WorkspaceNotFoundDefaultError);

    await this.workspaceOrmManager.executeInWorkspaceContext(async () => {
      const meetingTargetRepository =
        this.workspaceOrmManager.getRepository<MeetingTargetWorkspaceEntity>(
          'meetingTarget',
          { shouldBypassPermissionChecks: true },
        );

      await meetingTargetRepository.restore({
        meetingId: In(payload.map((meeting) => meeting.id)),
      });
    }, authContext);
  }
}
