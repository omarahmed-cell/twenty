import { Command } from 'nest-commander';
import { isDefined } from 'twenty-shared/utils';

import { ProvisionedWorkspaceCommandRunner } from 'src/database/commands/command-runners/provisioned-workspace.command-runner';
import { WorkspaceIteratorService } from 'src/database/commands/command-runners/workspace-iterator.service';
import { type RunOnWorkspaceArgs } from 'src/database/commands/command-runners/workspace.command-runner';
import { RegisteredWorkspaceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-workspace-command.decorator';
import { getWorkspaceSchemaName } from 'src/engine/workspace-datasource/utils/get-workspace-schema-name.util';

@RegisteredWorkspaceCommand('2.49.0', 1795631731213)
@Command({
  name: 'upgrade:2-49:create-roboost-duplicate-tables',
  description:
    'Create the duplicate pair, duplicate settings and bulk merge tables, and add the duplicate match count to imports',
})
export class CreateRoboostDuplicateTablesCommand extends ProvisionedWorkspaceCommandRunner {
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
        `[DRY RUN] Workspace ${workspaceId}: would create the duplicate tables`,
      );

      return;
    }

    await dataSource.query(`
      CREATE TABLE IF NOT EXISTS ${schema}."roboostDuplicatePair" (
        "id" uuid PRIMARY KEY,
        "objectName" text NOT NULL,
        "recordAId" uuid NOT NULL,
        "recordBId" uuid NOT NULL,
        "confidence" text NOT NULL,
        "reasons" jsonb NOT NULL DEFAULT '[]',
        "status" text NOT NULL DEFAULT 'OPEN',
        "detectedAt" timestamptz NOT NULL DEFAULT now(),
        "lastSeenAt" timestamptz NOT NULL DEFAULT now(),
        "resolvedAt" timestamptz,
        "resolvedById" uuid,
        "resolvedByName" text,
        "mergeId" uuid,
        UNIQUE ("objectName", "recordAId", "recordBId")
      )`);
    await dataSource.query(
      `CREATE INDEX IF NOT EXISTS "IDX_roboostDuplicatePair_status" ON ${schema}."roboostDuplicatePair" ("objectName", "status")`,
    );
    await dataSource.query(`
      CREATE TABLE IF NOT EXISTS ${schema}."roboostDuplicateSettings" (
        "objectName" text PRIMARY KEY,
        "rules" jsonb NOT NULL DEFAULT '{}',
        "lastScanAt" timestamptz,
        "lastScanPairCount" integer
      )`);
    await dataSource.query(`
      CREATE TABLE IF NOT EXISTS ${schema}."roboostBulkMerge" (
        "id" uuid PRIMARY KEY,
        "objectName" text NOT NULL,
        "status" text NOT NULL DEFAULT 'RUNNING',
        "total" integer NOT NULL DEFAULT 0,
        "doneCount" integer NOT NULL DEFAULT 0,
        "failedCount" integer NOT NULL DEFAULT 0,
        "pairs" jsonb NOT NULL DEFAULT '[]',
        "results" jsonb NOT NULL DEFAULT '[]',
        "startedById" uuid,
        "startedByName" text,
        "startedAt" timestamptz NOT NULL DEFAULT now(),
        "finishedAt" timestamptz
      )`);
    await dataSource.query(
      `ALTER TABLE IF EXISTS ${schema}."roboostImport" ADD COLUMN IF NOT EXISTS "duplicateMatchCount" integer`,
    );

    this.logger.log(`Workspace ${workspaceId}: duplicate tables ready`);
  }

  async down({ workspaceId, dataSource }: RunOnWorkspaceArgs): Promise<void> {
    if (!isDefined(dataSource)) {
      return;
    }

    const schema = `"${getWorkspaceSchemaName(workspaceId)}"`;

    await dataSource.query(
      `DROP TABLE IF EXISTS ${schema}."roboostDuplicatePair"`,
    );
    await dataSource.query(
      `DROP TABLE IF EXISTS ${schema}."roboostDuplicateSettings"`,
    );
    await dataSource.query(`DROP TABLE IF EXISTS ${schema}."roboostBulkMerge"`);
    await dataSource.query(
      `ALTER TABLE IF EXISTS ${schema}."roboostImport" DROP COLUMN IF EXISTS "duplicateMatchCount"`,
    );
  }
}
