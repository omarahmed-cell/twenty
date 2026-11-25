import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';

import {
  PermissionFlagType,
  ROBOOST_TOGGLE_OBJECT_PERMISSIONS,
  TOOL_PERMISSION_FLAGS,
} from 'twenty-shared/constants';
import { type RoboostUserPermissions } from 'twenty-shared/types';
import {
  getRoboostPermissionObjectItems,
  isDefined,
} from 'twenty-shared/utils';
import { DataSource } from 'typeorm';

import { ApplicationService } from 'src/engine/core-modules/application/application.service';
import { ObjectPermissionService } from 'src/engine/metadata-modules/object-permission/object-permission.service';
import { RolePermissionFlagService } from 'src/engine/metadata-modules/role-permission-flag/role-permission-flag.service';
import { RoleService } from 'src/engine/metadata-modules/role/role.service';
import { UserRoleService } from 'src/engine/metadata-modules/user-role/user-role.service';
import { WorkspaceCacheService } from 'src/engine/workspace-cache/services/workspace-cache.service';
import { STANDARD_ROLE } from 'src/engine/workspace-manager/twenty-standard-application/constants/standard-role.constant';

type ObjectPermissionValues = {
  canReadObjectRecords: boolean;
  canUpdateObjectRecords: boolean;
  canSoftDeleteObjectRecords: boolean;
  canDestroyObjectRecords: boolean;
};

// Flags the toggles below decide; every other tool flag stays on, like Twenty's Member role
const TOGGLED_TOOL_FLAGS: PermissionFlagType[] = [
  PermissionFlagType.VIEWS,
  PermissionFlagType.IMPORT_CSV,
  PermissionFlagType.EXPORT_CSV,
  PermissionFlagType.CONNECTED_ACCOUNTS,
  PermissionFlagType.SEND_EMAIL_TOOL,
  PermissionFlagType.CREATE_CALENDAR_EVENT_TOOL,
];

const isOn = (permissions: RoboostUserPermissions, toggleKey: string) =>
  permissions.toggles[toggleKey] === true;

export const computeRoboostPermissionFlags = (
  permissions: RoboostUserPermissions,
): PermissionFlagType[] => {
  const flags = new Set<PermissionFlagType>(
    TOOL_PERMISSION_FLAGS.filter((flag) => !TOGGLED_TOOL_FLAGS.includes(flag)),
  );
  const addIf = (condition: boolean, ...flagsToAdd: PermissionFlagType[]) => {
    if (condition) {
      flagsToAdd.forEach((flag) => flags.add(flag));
    }
  };

  addIf(isOn(permissions, 'createViews'), PermissionFlagType.VIEWS);
  addIf(isOn(permissions, 'import'), PermissionFlagType.IMPORT_CSV);
  addIf(isOn(permissions, 'export'), PermissionFlagType.EXPORT_CSV);
  addIf(
    isOn(permissions, 'connectGoogle'),
    PermissionFlagType.CONNECTED_ACCOUNTS,
    PermissionFlagType.SEND_EMAIL_TOOL,
    PermissionFlagType.CREATE_CALENDAR_EVENT_TOOL,
  );
  addIf(
    isOn(permissions, 'workflowsCreate') ||
      isOn(permissions, 'workflowsEdit') ||
      isOn(permissions, 'workflowsDelete'),
    PermissionFlagType.WORKFLOWS,
  );
  addIf(
    isOn(permissions, 'editPropertySettings'),
    PermissionFlagType.DATA_MODEL,
  );
  addIf(
    isOn(permissions, 'developerTools'),
    PermissionFlagType.API_KEYS_AND_WEBHOOKS,
  );
  addIf(
    isOn(permissions, 'appMarketplace'),
    PermissionFlagType.APPLICATIONS,
    PermissionFlagType.MARKETPLACE_APPS,
  );
  addIf(isOn(permissions, 'customizeCards'), PermissionFlagType.LAYOUTS);

  return [...flags].sort();
};

export const computeRoboostObjectPermissions = (
  permissions: RoboostUserPermissions,
): Record<string, ObjectPermissionValues> => {
  const canDestroy = isOn(permissions, 'permanentDelete');
  const result: Record<string, ObjectPermissionValues> = {};

  for (const item of getRoboostPermissionObjectItems()) {
    const objectPermissions = permissions.objects[item.key];
    const canRead = objectPermissions?.enabled === true;
    const canUpdate =
      canRead &&
      (objectPermissions.create === true ||
        (isDefined(objectPermissions.edit) &&
          objectPermissions.edit.scope !== 'NONE'));
    const canSoftDelete =
      canRead &&
      isDefined(objectPermissions.delete) &&
      objectPermissions.delete.scope !== 'NONE';

    result[item.objectNameSingular] = {
      canReadObjectRecords: canRead,
      canUpdateObjectRecords: canUpdate,
      canSoftDeleteObjectRecords: canSoftDelete,
      canDestroyObjectRecords: canSoftDelete && canDestroy,
    };
  }

  for (const objectNameSingular of ['product', 'dashboard']) {
    const toggles = ROBOOST_TOGGLE_OBJECT_PERMISSIONS[objectNameSingular];
    const anyOn = (keys: string[] | undefined) =>
      (keys ?? []).some((key) => isOn(permissions, key));
    const canRead = anyOn(toggles.view);
    const canSoftDelete = canRead && anyOn(toggles.delete);

    result[objectNameSingular] = {
      canReadObjectRecords: canRead,
      canUpdateObjectRecords:
        canRead && (anyOn(toggles.create) || anyOn(toggles.edit)),
      canSoftDeleteObjectRecords: canSoftDelete,
      canDestroyObjectRecords: canSoftDelete && canDestroy,
    };
  }

  return result;
};

@Injectable()
export class RoboostRoleSyncService {
  constructor(
    @InjectDataSource()
    private readonly coreDataSource: DataSource,
    private readonly applicationService: ApplicationService,
    private readonly roleService: RoleService,
    private readonly objectPermissionService: ObjectPermissionService,
    private readonly rolePermissionFlagService: RolePermissionFlagService,
    private readonly userRoleService: UserRoleService,
    private readonly workspaceCacheService: WorkspaceCacheService,
  ) {}

  async getAdminRoleId(workspaceId: string): Promise<string> {
    const rows: { id: string }[] = await this.coreDataSource.query(
      `SELECT id FROM core."role" WHERE "workspaceId" = $1 AND "universalIdentifier" = $2`,
      [workspaceId, STANDARD_ROLE.admin.universalIdentifier],
    );

    if (rows.length === 0) {
      throw new Error(`Admin role not found for workspace ${workspaceId}`);
    }

    return rows[0].id;
  }

  async roleExists(workspaceId: string, roleId: string): Promise<boolean> {
    const rows: unknown[] = await this.coreDataSource.query(
      `SELECT 1 FROM core."role" WHERE "workspaceId" = $1 AND id = $2`,
      [workspaceId, roleId],
    );

    return rows.length > 0;
  }

  // Creates or updates the member's private role so it matches their saved permissions
  async syncPrivateRole({
    workspaceId,
    workspaceMemberId,
    memberName,
    existingRoleId,
    permissions,
  }: {
    workspaceId: string;
    workspaceMemberId: string;
    memberName: string;
    existingRoleId: string | null;
    permissions: RoboostUserPermissions;
  }): Promise<string> {
    const roleFields = {
      canUpdateAllSettings: false,
      canAccessAllTools: false,
      canReadAllObjectRecords: true,
      canUpdateAllObjectRecords: true,
      canSoftDeleteAllObjectRecords: true,
      canDestroyAllObjectRecords: isOn(permissions, 'permanentDelete'),
    };

    let roleId =
      isDefined(existingRoleId) &&
      (await this.roleExists(workspaceId, existingRoleId))
        ? existingRoleId
        : null;

    if (isDefined(roleId)) {
      await this.roleService.updateRole({
        input: { id: roleId, update: roleFields },
        workspaceId,
      });
    } else {
      const { workspaceCustomFlatApplication } =
        await this.applicationService.findWorkspaceTwentyStandardAndCustomApplicationOrThrow(
          { workspaceId },
        );

      const role = await this.roleService.createRole({
        input: {
          label: `User: ${memberName} (${workspaceMemberId.slice(0, 8)})`,
          description:
            'Private role managed by Settings > Users & Teams. Do not edit or assign it.',
          icon: 'IconUser',
          ...roleFields,
          canBeAssignedToUsers: true,
          canBeAssignedToAgents: false,
          canBeAssignedToApiKeys: false,
        },
        workspaceId,
        ownerFlatApplication: workspaceCustomFlatApplication,
      });

      roleId = role.id;
    }

    const objectIdByName = await this.getObjectIdByNameSingular(workspaceId);
    const objectPermissions = Object.entries(
      computeRoboostObjectPermissions(permissions),
    )
      .filter(([objectNameSingular]) =>
        isDefined(objectIdByName[objectNameSingular]),
      )
      .map(([objectNameSingular, values]) => ({
        objectMetadataId: objectIdByName[objectNameSingular],
        ...values,
      }));

    await this.objectPermissionService.upsertObjectPermissions({
      workspaceId,
      input: { roleId, objectPermissions },
    });

    await this.rolePermissionFlagService.upsertPermissionFlags({
      workspaceId,
      input: {
        roleId,
        permissionFlagKeys: computeRoboostPermissionFlags(permissions),
      },
    });

    return roleId;
  }

  async assignRole({
    workspaceId,
    userWorkspaceId,
    roleId,
  }: {
    workspaceId: string;
    userWorkspaceId: string;
    roleId: string;
  }): Promise<void> {
    const currentRoleId = await this.userRoleService.getRoleIdForUserWorkspace({
      workspaceId,
      userWorkspaceId,
    });

    if (currentRoleId === roleId) {
      return;
    }

    await this.userRoleService.assignRoleToManyUserWorkspace({
      workspaceId,
      userWorkspaceIds: [userWorkspaceId],
      roleId,
    });
  }

  async invalidateRecordAccess(workspaceId: string): Promise<void> {
    await this.workspaceCacheService.invalidateAndRecompute(workspaceId, [
      'roboostRecordAccessMaps',
    ]);
  }

  private async getObjectIdByNameSingular(
    workspaceId: string,
  ): Promise<Record<string, string>> {
    const rows: { id: string; nameSingular: string }[] =
      await this.coreDataSource.query(
        `SELECT id, "nameSingular" FROM core."objectMetadata" WHERE "workspaceId" = $1`,
        [workspaceId],
      );

    return Object.fromEntries(rows.map((row) => [row.nameSingular, row.id]));
  }
}
