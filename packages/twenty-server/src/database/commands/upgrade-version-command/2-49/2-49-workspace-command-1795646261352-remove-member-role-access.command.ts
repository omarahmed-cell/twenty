import { Command, Option } from 'nest-commander';
import { isDefined } from 'twenty-shared/utils';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';

import {
  ProvisionedWorkspaceCommandRunner,
  type ProvisionedWorkspaceCommandOptions,
} from 'src/database/commands/command-runners/provisioned-workspace.command-runner';
import { WorkspaceIteratorService } from 'src/database/commands/command-runners/workspace-iterator.service';
import { type RunOnWorkspaceArgs } from 'src/database/commands/command-runners/workspace.command-runner';
import { RegisteredWorkspaceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-workspace-command.decorator';
import { MEMBER_ROLE_LABEL } from 'src/engine/metadata-modules/permissions/constants/member-role-label.constants';
import { ObjectPermissionService } from 'src/engine/metadata-modules/object-permission/object-permission.service';
import { RolePermissionFlagService } from 'src/engine/metadata-modules/role-permission-flag/role-permission-flag.service';
import { RoleService } from 'src/engine/metadata-modules/role/role.service';

type RemoveMemberRoleAccessCommandOptions =
  ProvisionedWorkspaceCommandOptions & {
    rollback?: boolean;
  };

const setRecordAccess = (hasAccess: boolean) => ({
  canAccessAllTools: hasAccess,
  canReadAllObjectRecords: hasAccess,
  canUpdateAllObjectRecords: hasAccess,
  canSoftDeleteAllObjectRecords: hasAccess,
  canDestroyAllObjectRecords: hasAccess,
});

@RegisteredWorkspaceCommand('2.49.0', 1795646261352)
@Command({
  name: 'upgrade:2-49:remove-member-role-access',
  description:
    "Turn the workspace's default Member role into a role with no access, since every member runs on their private Users & Teams role. Pass --rollback to give it back full record access.",
})
export class RemoveMemberRoleAccessCommand extends ProvisionedWorkspaceCommandRunner<RemoveMemberRoleAccessCommandOptions> {
  constructor(
    protected readonly workspaceIteratorService: WorkspaceIteratorService,
    @InjectDataSource()
    private readonly coreDataSource: DataSource,
    private readonly roleService: RoleService,
    private readonly rolePermissionFlagService: RolePermissionFlagService,
    private readonly objectPermissionService: ObjectPermissionService,
  ) {
    super(workspaceIteratorService);
  }

  @Option({
    flags: '--rollback',
    description: 'Give the Member role back full record access',
  })
  parseRollback(): boolean {
    return true;
  }

  override async runOnWorkspace(
    args: RunOnWorkspaceArgs<RemoveMemberRoleAccessCommandOptions>,
  ): Promise<void> {
    if (args.options.rollback === true) {
      await this.down(args);

      return;
    }

    await this.up(args);
  }

  private async findMemberRoleId(workspaceId: string): Promise<string | null> {
    const rows: { id: string }[] = await this.coreDataSource.query(
      `SELECT r.id FROM core."role" r
        JOIN core."workspace" w ON w.id = r."workspaceId" AND w."defaultRoleId" = r.id
        WHERE r."workspaceId" = $1 AND r.label = $2`,
      [workspaceId, MEMBER_ROLE_LABEL],
    );

    return rows[0]?.id ?? null;
  }

  async up({
    workspaceId,
    options,
  }: RunOnWorkspaceArgs<RemoveMemberRoleAccessCommandOptions>): Promise<void> {
    const roleId = await this.findMemberRoleId(workspaceId);

    if (!isDefined(roleId)) {
      this.logger.log(
        `Workspace ${workspaceId}: no default Member role, nothing to do`,
      );

      return;
    }

    const objectPermissionRows: { objectMetadataId: string }[] =
      await this.coreDataSource.query(
        `SELECT "objectMetadataId" FROM core."objectPermission" WHERE "roleId" = $1`,
        [roleId],
      );

    if (options.dryRun) {
      this.logger.log(
        `[DRY RUN] Workspace ${workspaceId}: would remove all access from the Member role (${objectPermissionRows.length} object permissions)`,
      );

      return;
    }

    await this.roleService.updateRole({
      input: {
        id: roleId,
        update: {
          ...setRecordAccess(false),
          description:
            'Default role with no access. Members run on their private Users & Teams role.',
        },
      },
      workspaceId,
    });

    await this.rolePermissionFlagService.upsertPermissionFlags({
      workspaceId,
      input: { roleId, permissionFlagKeys: [] },
    });

    if (objectPermissionRows.length > 0) {
      await this.objectPermissionService.upsertObjectPermissions({
        workspaceId,
        input: {
          roleId,
          objectPermissions: objectPermissionRows.map(
            ({ objectMetadataId }) => ({
              objectMetadataId,
              canReadObjectRecords: false,
              canUpdateObjectRecords: false,
              canSoftDeleteObjectRecords: false,
              canDestroyObjectRecords: false,
            }),
          ),
        },
      });
    }

    this.logger.log(
      `Workspace ${workspaceId}: the Member role now has no access`,
    );
  }

  async down({
    workspaceId,
  }: RunOnWorkspaceArgs<RemoveMemberRoleAccessCommandOptions>): Promise<void> {
    const roleId = await this.findMemberRoleId(workspaceId);

    if (!isDefined(roleId)) {
      return;
    }

    await this.roleService.updateRole({
      input: {
        id: roleId,
        update: { ...setRecordAccess(true), description: 'Member role' },
      },
      workspaceId,
    });

    this.logger.log(
      `Workspace ${workspaceId}: the Member role has full record access again`,
    );
  }
}
