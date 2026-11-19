import { Injectable } from '@nestjs/common';

import { msg } from '@lingui/core/macro';
import { isNonEmptyString } from '@sniptt/guards';
import { isDefined } from 'twenty-shared/utils';
import { In } from 'typeorm';

import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import {
  PermissionsException,
  PermissionsExceptionCode,
  PermissionsExceptionMessage,
} from 'src/engine/metadata-modules/permissions/permissions.exception';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
import { WorkspaceOrmManager } from 'src/engine/twenty-orm/workspace-orm.manager';
import { PipelineAccessService } from 'src/modules/pipeline/services/pipeline-access.service';
import {
  PROPERTY_CREATION_OBJECT_NAME,
  PROPERTY_SETTINGS_OBJECT_NAMES,
} from 'src/modules/properties/constants/property-object-names.constant';
import { PropertyLogicConfigService } from 'src/modules/properties/services/property-logic-config.service';
import { type PropertyGroupMembershipWorkspaceEntity } from 'src/modules/properties/standard-objects/property-group-membership.workspace-entity';

// Groups and rules are workspace configuration: Admins write them, every role reads them
@Injectable()
export class PropertySettingsWriteService {
  constructor(
    private readonly workspaceOrmManager: WorkspaceOrmManager,
    private readonly pipelineAccessService: PipelineAccessService,
    private readonly propertyLogicConfigService: PropertyLogicConfigService,
  ) {}

  isPropertyObject(objectName: string) {
    return (
      PROPERTY_SETTINGS_OBJECT_NAMES.has(objectName) ||
      objectName === PROPERTY_CREATION_OBJECT_NAME
    );
  }

  async assertCanWrite(authContext: WorkspaceAuthContext, objectName: string) {
    if (authContext.type === 'system') {
      return;
    }

    const isAllowed =
      objectName !== PROPERTY_CREATION_OBJECT_NAME &&
      (await this.pipelineAccessService.canEditPipelines(authContext));

    if (!isAllowed) {
      throw new PermissionsException(
        PermissionsExceptionMessage.PERMISSION_DENIED,
        PermissionsExceptionCode.PERMISSION_DENIED,
        {
          userFriendlyMessage:
            objectName === PROPERTY_CREATION_OBJECT_NAME
              ? msg`Only Roboost CRM records who created a property.`
              : msg`Only workspace admins can change property groups and conditional logic.`,
        },
      );
    }
  }

  // A property belongs to at most one group, so joining a group leaves the previous one
  async releaseFieldsFromOtherGroups({
    workspaceId,
    memberships,
  }: {
    workspaceId: string;
    memberships: Record<string, unknown>[];
  }) {
    const fieldMetadataIds = memberships
      .map(({ fieldMetadataId }) => fieldMetadataId)
      .filter(isNonEmptyString);

    if (fieldMetadataIds.length === 0) {
      return;
    }

    await this.workspaceOrmManager.executeInWorkspaceContext(async () => {
      await this.getMembershipRepository().delete({
        fieldMetadataId: In(fieldMetadataIds),
      });
    }, buildSystemAuthContext(workspaceId));
  }

  // Deleting a group never deletes its properties; they just have no group
  async releaseGroupMembers({
    workspaceId,
    propertyGroupIds,
  }: {
    workspaceId: string;
    propertyGroupIds: string[];
  }) {
    if (propertyGroupIds.length === 0) {
      return;
    }

    await this.workspaceOrmManager.executeInWorkspaceContext(async () => {
      await this.getMembershipRepository().delete({
        propertyGroupId: In(propertyGroupIds),
      });
    }, buildSystemAuthContext(workspaceId));
  }

  invalidateRules(workspaceId: string) {
    this.propertyLogicConfigService.invalidate(workspaceId);
  }

  private getMembershipRepository() {
    return this.workspaceOrmManager.getRepository<PropertyGroupMembershipWorkspaceEntity>(
      'propertyGroupMembership',
      { shouldBypassPermissionChecks: true },
    );
  }
}

export const getDeletedRecordIds = (payload: unknown): string[] => {
  const records = Array.isArray(payload) ? payload : [payload];

  return records
    .map((record) =>
      isDefined(record) && typeof record === 'object'
        ? (record as { id?: unknown }).id
        : undefined,
    )
    .filter(isNonEmptyString);
};
