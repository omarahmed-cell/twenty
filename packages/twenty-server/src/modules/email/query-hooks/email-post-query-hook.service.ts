import { Injectable } from '@nestjs/common';

import { assertIsDefinedOrThrow } from 'twenty-shared/utils';
import { In } from 'typeorm';

import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { WorkspaceNotFoundDefaultError } from 'src/engine/core-modules/workspace/workspace.exception';
import { WorkspaceOrmManager } from 'src/engine/twenty-orm/workspace-orm.manager';
import { EmailTargetWorkspaceEntity } from 'src/modules/email/standard-objects/email-target.workspace-entity';
import { EmailWorkspaceEntity } from 'src/modules/email/standard-objects/email.workspace-entity';

@Injectable()
export class EmailPostQueryHookService {
  constructor(private readonly workspaceOrmManager: WorkspaceOrmManager) {}

  async handleEmailTargetsDelete(
    authContext: WorkspaceAuthContext,
    payload: EmailWorkspaceEntity[],
  ): Promise<void> {
    if (!payload || payload?.length === 0) {
      return;
    }

    const workspace = authContext.workspace;

    assertIsDefinedOrThrow(workspace, WorkspaceNotFoundDefaultError);

    await this.workspaceOrmManager.executeInWorkspaceContext(async () => {
      const emailTargetRepository =
        this.workspaceOrmManager.getRepository<EmailTargetWorkspaceEntity>(
          'emailTarget',
          { shouldBypassPermissionChecks: true },
        );

      await emailTargetRepository.softDelete({
        emailId: In(payload.map((email) => email.id)),
      });
    }, authContext);
  }

  async handleEmailTargetsRestore(
    authContext: WorkspaceAuthContext,
    payload: EmailWorkspaceEntity[],
  ): Promise<void> {
    if (!payload || payload?.length === 0) {
      return;
    }

    const workspace = authContext.workspace;

    assertIsDefinedOrThrow(workspace, WorkspaceNotFoundDefaultError);

    await this.workspaceOrmManager.executeInWorkspaceContext(async () => {
      const emailTargetRepository =
        this.workspaceOrmManager.getRepository<EmailTargetWorkspaceEntity>(
          'emailTarget',
          { shouldBypassPermissionChecks: true },
        );

      await emailTargetRepository.restore({
        emailId: In(payload.map((email) => email.id)),
      });
    }, authContext);
  }
}
