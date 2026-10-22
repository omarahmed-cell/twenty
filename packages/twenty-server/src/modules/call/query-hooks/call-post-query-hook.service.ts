import { Injectable } from '@nestjs/common';

import { assertIsDefinedOrThrow } from 'twenty-shared/utils';
import { In } from 'typeorm';

import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { WorkspaceNotFoundDefaultError } from 'src/engine/core-modules/workspace/workspace.exception';
import { WorkspaceOrmManager } from 'src/engine/twenty-orm/workspace-orm.manager';
import { CallTargetWorkspaceEntity } from 'src/modules/call/standard-objects/call-target.workspace-entity';
import { CallWorkspaceEntity } from 'src/modules/call/standard-objects/call.workspace-entity';

@Injectable()
export class CallPostQueryHookService {
  constructor(private readonly workspaceOrmManager: WorkspaceOrmManager) {}

  async handleCallTargetsDelete(
    authContext: WorkspaceAuthContext,
    payload: CallWorkspaceEntity[],
  ): Promise<void> {
    if (!payload || payload?.length === 0) {
      return;
    }

    const workspace = authContext.workspace;

    assertIsDefinedOrThrow(workspace, WorkspaceNotFoundDefaultError);

    await this.workspaceOrmManager.executeInWorkspaceContext(async () => {
      const callTargetRepository =
        this.workspaceOrmManager.getRepository<CallTargetWorkspaceEntity>(
          'callTarget',
          { shouldBypassPermissionChecks: true },
        );

      await callTargetRepository.softDelete({
        callId: In(payload.map((call) => call.id)),
      });
    }, authContext);
  }

  async handleCallTargetsRestore(
    authContext: WorkspaceAuthContext,
    payload: CallWorkspaceEntity[],
  ): Promise<void> {
    if (!payload || payload?.length === 0) {
      return;
    }

    const workspace = authContext.workspace;

    assertIsDefinedOrThrow(workspace, WorkspaceNotFoundDefaultError);

    await this.workspaceOrmManager.executeInWorkspaceContext(async () => {
      const callTargetRepository =
        this.workspaceOrmManager.getRepository<CallTargetWorkspaceEntity>(
          'callTarget',
          { shouldBypassPermissionChecks: true },
        );

      await callTargetRepository.restore({
        callId: In(payload.map((call) => call.id)),
      });
    }, authContext);
  }
}
