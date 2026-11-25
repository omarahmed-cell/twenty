import { Command } from 'nest-commander';
import { isDefined } from 'twenty-shared/utils';

import { ProvisionedWorkspaceCommandRunner } from 'src/database/commands/command-runners/provisioned-workspace.command-runner';
import { WorkspaceIteratorService } from 'src/database/commands/command-runners/workspace-iterator.service';
import { type RunOnWorkspaceArgs } from 'src/database/commands/command-runners/workspace.command-runner';
import { RegisteredWorkspaceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-workspace-command.decorator';
import { getWorkspaceSchemaName } from 'src/engine/workspace-datasource/utils/get-workspace-schema-name.util';

// Per-user permissions live in plain tables, like scores: hidden from navigation, the data model and the API
@RegisteredWorkspaceCommand('2.49.0', 1795615751436)
@Command({
  name: 'upgrade:2-49:create-roboost-user-permission-tables',
  description:
    'Create the per-user permission, pending invite and permission history tables for Users & Teams',
})
export class CreateRoboostUserPermissionTablesCommand extends ProvisionedWorkspaceCommandRunner {
  constructor(
    protected readonly workspaceIteratorService: WorkspaceIteratorService,
  ) {
    super(workspaceIteratorService);
  }

  override async runOnWorkspace(args: RunOnWorkspaceArgs): Promise<void> {
    await this.up(args);
  }

  async up({
    workspaceId,
    dataSource,
    options,
  }: RunOnWorkspaceArgs): Promise<void> {
    if (!isDefined(dataSource)) {
      return;
    }

    const schema = `"${getWorkspaceSchemaName(workspaceId)}"`;

    if (options.dryRun) {
      this.logger.log(
        `[DRY RUN] Workspace ${workspaceId}: would create the user permission tables`,
      );

      return;
    }

    await dataSource.query(`
      CREATE TABLE IF NOT EXISTS ${schema}."roboostUserPermission" (
        "workspaceMemberId" uuid PRIMARY KEY,
        "roleId" uuid,
        permissions jsonb NOT NULL,
        "desiredRole" text NOT NULL DEFAULT 'MEMBER',
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        "updatedById" uuid
      )`);
    await dataSource.query(
      `CREATE INDEX IF NOT EXISTS "IDX_roboostUserPermission_role" ON ${schema}."roboostUserPermission" ("roleId")`,
    );
    await dataSource.query(`
      CREATE TABLE IF NOT EXISTS ${schema}."roboostPendingInvite" (
        email text PRIMARY KEY,
        role text NOT NULL DEFAULT 'MEMBER',
        permissions jsonb NOT NULL,
        "copiedFromWorkspaceMemberId" uuid,
        "invitedById" uuid,
        "invitedAt" timestamptz NOT NULL DEFAULT now()
      )`);
    await dataSource.query(`
      CREATE TABLE IF NOT EXISTS ${schema}."roboostPermissionHistory" (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "actorWorkspaceMemberId" uuid,
        "actorName" text,
        "targetWorkspaceMemberId" uuid,
        "targetLabel" text NOT NULL,
        kind text NOT NULL,
        setting text NOT NULL,
        "fromValue" text,
        "toValue" text
      )`);
    await dataSource.query(
      `CREATE INDEX IF NOT EXISTS "IDX_roboostPermissionHistory_target" ON ${schema}."roboostPermissionHistory" ("targetWorkspaceMemberId", "createdAt" DESC)`,
    );

    this.logger.log(`Workspace ${workspaceId}: user permission tables ready`);
  }

  async down({ workspaceId, dataSource }: RunOnWorkspaceArgs): Promise<void> {
    if (!isDefined(dataSource)) {
      return;
    }
    const schema = `"${getWorkspaceSchemaName(workspaceId)}"`;

    await dataSource.query(
      `DROP TABLE IF EXISTS ${schema}."roboostPermissionHistory", ${schema}."roboostPendingInvite", ${schema}."roboostUserPermission"`,
    );
  }
}
