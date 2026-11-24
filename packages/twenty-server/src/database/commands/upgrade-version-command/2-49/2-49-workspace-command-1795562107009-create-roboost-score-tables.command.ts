import { Command } from 'nest-commander';
import { isDefined } from 'twenty-shared/utils';

import { ProvisionedWorkspaceCommandRunner } from 'src/database/commands/command-runners/provisioned-workspace.command-runner';
import { WorkspaceIteratorService } from 'src/database/commands/command-runners/workspace-iterator.service';
import { type RunOnWorkspaceArgs } from 'src/database/commands/command-runners/workspace.command-runner';
import { RegisteredWorkspaceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-workspace-command.decorator';
import { getWorkspaceSchemaName } from 'src/engine/workspace-datasource/utils/get-workspace-schema-name.util';

// Scores live in plain tables, like notifications: hidden from navigation, the data model and the API
@RegisteredWorkspaceCommand('2.49.0', 1795562107009)
@Command({
  name: 'upgrade:2-49:create-roboost-score-tables',
  description:
    'Create the score, score version and score result tables for the Scoring module',
})
export class CreateRoboostScoreTablesCommand extends ProvisionedWorkspaceCommandRunner {
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
        `[DRY RUN] Workspace ${workspaceId}: would create the score tables`,
      );

      return;
    }

    await dataSource.query(`
      CREATE TABLE IF NOT EXISTS ${schema}."roboostScore" (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name text NOT NULL,
        description text,
        "objectName" text NOT NULL,
        "isActive" boolean NOT NULL DEFAULT false,
        "scoreMin" integer NOT NULL DEFAULT -100,
        "scoreMax" integer NOT NULL DEFAULT 100,
        "linkedFieldMetadataId" uuid UNIQUE,
        "freezeOnClosedWon" boolean NOT NULL DEFAULT true,
        "publishedVersionId" uuid,
        draft jsonb NOT NULL,
        "hasDraftChanges" boolean NOT NULL DEFAULT true,
        "recalcStatus" text,
        "recalcTotal" integer,
        "recalcDone" integer,
        "recalcStartedAt" timestamptz,
        "recalcFinishedAt" timestamptz,
        "lastFullRecalcAt" timestamptz,
        "lastVerifiedAt" timestamptz,
        "lastDriftCount" integer,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "createdById" uuid,
        "createdByName" text,
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        "updatedById" uuid,
        "updatedByName" text
      )`);
    await dataSource.query(`
      CREATE TABLE IF NOT EXISTS ${schema}."roboostScoreVersion" (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "scoreId" uuid NOT NULL REFERENCES ${schema}."roboostScore"(id) ON DELETE CASCADE,
        version integer NOT NULL,
        criteria jsonb NOT NULL,
        "publishedAt" timestamptz NOT NULL DEFAULT now(),
        "publishedById" uuid,
        "publishedByName" text,
        note text,
        UNIQUE ("scoreId", version)
      )`);
    await dataSource.query(`
      CREATE TABLE IF NOT EXISTS ${schema}."roboostScoreResult" (
        "scoreId" uuid NOT NULL REFERENCES ${schema}."roboostScore"(id) ON DELETE CASCADE,
        "recordId" uuid NOT NULL,
        value double precision,
        "versionId" uuid,
        "versionNumber" integer,
        breakdown jsonb,
        "computedAt" timestamptz NOT NULL DEFAULT now(),
        frozen boolean NOT NULL DEFAULT false,
        "frozenAt" timestamptz,
        source text NOT NULL DEFAULT 'SCORE',
        PRIMARY KEY ("scoreId", "recordId")
      )`);
    await dataSource.query(
      `CREATE INDEX IF NOT EXISTS "IDX_roboostScoreResult_record" ON ${schema}."roboostScoreResult" ("recordId")`,
    );

    this.logger.log(`Workspace ${workspaceId}: score tables ready`);
  }

  async down({ workspaceId, dataSource }: RunOnWorkspaceArgs): Promise<void> {
    if (!isDefined(dataSource)) {
      return;
    }
    const schema = `"${getWorkspaceSchemaName(workspaceId)}"`;

    await dataSource.query(
      `DROP TABLE IF EXISTS ${schema}."roboostScoreResult", ${schema}."roboostScoreVersion", ${schema}."roboostScore"`,
    );
  }
}
