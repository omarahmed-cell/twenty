import { Injectable } from '@nestjs/common';

import { assertIsDefinedOrThrow } from 'twenty-shared/utils';
import { In } from 'typeorm';

import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { WorkspaceNotFoundDefaultError } from 'src/engine/core-modules/workspace/workspace.exception';
import { WorkspaceOrmManager } from 'src/engine/twenty-orm/workspace-orm.manager';
import { CommunicationTargetWorkspaceEntity } from 'src/modules/communication/standard-objects/communication-target.workspace-entity';
import { CommunicationWorkspaceEntity } from 'src/modules/communication/standard-objects/communication.workspace-entity';

@Injectable()
export class CommunicationPostQueryHookService {
  constructor(private readonly workspaceOrmManager: WorkspaceOrmManager) {}

  async handleCommunicationTargetsDelete(
    authContext: WorkspaceAuthContext,
    payload: CommunicationWorkspaceEntity[],
  ): Promise<void> {
    if (!payload || payload?.length === 0) {
      return;
    }

    const workspace = authContext.workspace;

    assertIsDefinedOrThrow(workspace, WorkspaceNotFoundDefaultError);

    await this.workspaceOrmManager.executeInWorkspaceContext(async () => {
      const communicationTargetRepository =
        this.workspaceOrmManager.getRepository<CommunicationTargetWorkspaceEntity>(
          'communicationTarget',
          { shouldBypassPermissionChecks: true },
        );

      await communicationTargetRepository.softDelete({
        communicationId: In(payload.map((communication) => communication.id)),
      });
    }, authContext);
  }

  async handleCommunicationTargetsRestore(
    authContext: WorkspaceAuthContext,
    payload: CommunicationWorkspaceEntity[],
  ): Promise<void> {
    if (!payload || payload?.length === 0) {
      return;
    }

    const workspace = authContext.workspace;

    assertIsDefinedOrThrow(workspace, WorkspaceNotFoundDefaultError);

    await this.workspaceOrmManager.executeInWorkspaceContext(async () => {
      const communicationTargetRepository =
        this.workspaceOrmManager.getRepository<CommunicationTargetWorkspaceEntity>(
          'communicationTarget',
          { shouldBypassPermissionChecks: true },
        );

      await communicationTargetRepository.restore({
        communicationId: In(payload.map((communication) => communication.id)),
      });
    }, authContext);
  }
}
