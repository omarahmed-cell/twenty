import { Command } from 'nest-commander';
import { isDefined } from 'twenty-shared/utils';

import { ProvisionedWorkspaceCommandRunner } from 'src/database/commands/command-runners/provisioned-workspace.command-runner';
import { WorkspaceIteratorService } from 'src/database/commands/command-runners/workspace-iterator.service';
import { type RunOnWorkspaceArgs } from 'src/database/commands/command-runners/workspace.command-runner';
import { RegisteredWorkspaceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-workspace-command.decorator';
import { getWorkspaceSchemaName } from 'src/engine/workspace-datasource/utils/get-workspace-schema-name.util';

// Export audit (with the file kept 30 days), the import log, and which records each import touched
@RegisteredWorkspaceCommand('2.49.0', 1795544772205)
@Command({
  name: 'upgrade:2-49:create-roboost-data-transfer-tables',
  description:
    'Create the export audit, import log and import-record link tables for Settings > Data management',
})
export class CreateRoboostDataTransferTablesCommand extends ProvisionedWorkspaceCommandRunner {
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
        `[DRY RUN] Workspace ${workspaceId}: would create the export and import tables`,
      );

      return;
    }

    await dataSource.query(`
      CREATE TABLE IF NOT EXISTS ${schema}."roboostExport" (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name text NOT NULL,
        source text NOT NULL,
        "objectNameSingular" text,
        "recordCount" integer NOT NULL DEFAULT 0,
        "workspaceMemberId" uuid,
        "userName" text,
        "userEmail" text,
        "fileName" text NOT NULL,
        content text,
        "expiredAt" timestamptz,
        "createdAt" timestamptz NOT NULL DEFAULT now()
      )`);
    await dataSource.query(
      `CREATE INDEX IF NOT EXISTS "IDX_roboostExport_createdAt" ON ${schema}."roboostExport" ("createdAt" DESC)`,
    );
    await dataSource.query(`
      CREATE TABLE IF NOT EXISTS ${schema}."roboostImport" (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name text NOT NULL,
        "objectNameSingular" text NOT NULL,
        state text NOT NULL DEFAULT 'IN_PROGRESS',
        "newCount" integer NOT NULL DEFAULT 0,
        "updatedCount" integer NOT NULL DEFAULT 0,
        "newAssociations" integer NOT NULL DEFAULT 0,
        "errorCount" integer NOT NULL DEFAULT 0,
        "errorFile" text,
        "workspaceMemberId" uuid,
        "createdByName" text,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "finishedAt" timestamptz
      )`);
    await dataSource.query(
      `CREATE INDEX IF NOT EXISTS "IDX_roboostImport_createdAt" ON ${schema}."roboostImport" ("createdAt" DESC)`,
    );
    await dataSource.query(`
      CREATE TABLE IF NOT EXISTS ${schema}."roboostImportRecord" (
        "importId" uuid NOT NULL REFERENCES ${schema}."roboostImport"(id) ON DELETE CASCADE,
        "recordId" uuid NOT NULL,
        "objectNameSingular" text NOT NULL,
        PRIMARY KEY ("importId", "recordId")
      )`);
    await dataSource.query(
      `CREATE INDEX IF NOT EXISTS "IDX_roboostImportRecord_record" ON ${schema}."roboostImportRecord" ("objectNameSingular", "recordId")`,
    );

    this.logger.log(
      `Workspace ${workspaceId}: export and import tables ready`,
    );
  }

  async down({ workspaceId, dataSource }: RunOnWorkspaceArgs): Promise<void> {
    if (!isDefined(dataSource)) {
      return;
    }
    const schema = `"${getWorkspaceSchemaName(workspaceId)}"`;

    await dataSource.query(`DROP TABLE IF EXISTS ${schema}."roboostImportRecord"`);
    await dataSource.query(`DROP TABLE IF EXISTS ${schema}."roboostImport"`);
    await dataSource.query(`DROP TABLE IF EXISTS ${schema}."roboostExport"`);
  }
}
