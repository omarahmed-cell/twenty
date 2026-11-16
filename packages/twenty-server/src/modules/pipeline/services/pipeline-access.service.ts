import { Injectable } from '@nestjs/common';

import { msg } from '@lingui/core/macro';
import { isDefined } from 'twenty-shared/utils';

import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import {
  PermissionsException,
  PermissionsExceptionCode,
  PermissionsExceptionMessage,
} from 'src/engine/metadata-modules/permissions/permissions.exception';
import { findFlatEntityByIdInFlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/utils/find-flat-entity-by-id-in-flat-entity-maps.util';
import { WorkspaceCacheService } from 'src/engine/workspace-cache/services/workspace-cache.service';
import { STANDARD_ROLE } from 'src/engine/workspace-manager/twenty-standard-application/constants/standard-role.constant';

// Pipelines are workspace configuration: only the Admin role may change them, every other role reads them
@Injectable()
export class PipelineAccessService {
  constructor(private readonly workspaceCacheService: WorkspaceCacheService) {}

  async canEditPipelines(authContext: WorkspaceAuthContext): Promise<boolean> {
    if (authContext.type === 'system') {
      return true;
    }

    return this.canActorEditPipelines({
      workspaceId: authContext.workspace.id,
      userWorkspaceId:
        authContext.type === 'user' ? authContext.userWorkspaceId : undefined,
      apiKeyId:
        authContext.type === 'apiKey' ? authContext.apiKey.id : undefined,
    });
  }

  async canActorEditPipelines({
    workspaceId,
    userWorkspaceId,
    apiKeyId,
  }: {
    workspaceId: string;
    userWorkspaceId?: string;
    apiKeyId?: string;
  }): Promise<boolean> {
    const { userWorkspaceRoleMap, apiKeyRoleMap, flatRoleMaps } =
      await this.workspaceCacheService.getOrRecompute(workspaceId, [
        'userWorkspaceRoleMap',
        'apiKeyRoleMap',
        'flatRoleMaps',
      ]);

    const roleId = isDefined(userWorkspaceId)
      ? userWorkspaceRoleMap[userWorkspaceId]
      : isDefined(apiKeyId)
        ? apiKeyRoleMap[apiKeyId]
        : undefined;

    if (!isDefined(roleId)) {
      return false;
    }

    const role = findFlatEntityByIdInFlatEntityMaps({
      flatEntityId: roleId,
      flatEntityMaps: flatRoleMaps,
    });

    return (
      role?.universalIdentifier === STANDARD_ROLE.admin.universalIdentifier
    );
  }

  async assertCanEditPipelines(authContext: WorkspaceAuthContext) {
    if (!(await this.canEditPipelines(authContext))) {
      throw new PermissionsException(
        PermissionsExceptionMessage.PERMISSION_DENIED,
        PermissionsExceptionCode.PERMISSION_DENIED,
        {
          userFriendlyMessage: msg`Only workspace admins can change pipelines.`,
        },
      );
    }
  }
}
