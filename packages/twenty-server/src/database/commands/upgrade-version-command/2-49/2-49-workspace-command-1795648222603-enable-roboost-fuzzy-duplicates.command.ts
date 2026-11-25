import { Command } from 'nest-commander';
import { isDefined } from 'twenty-shared/utils';

import { ProvisionedWorkspaceCommandRunner } from 'src/database/commands/command-runners/provisioned-workspace.command-runner';
import { WorkspaceIteratorService } from 'src/database/commands/command-runners/workspace-iterator.service';
import { type RunOnWorkspaceArgs } from 'src/database/commands/command-runners/workspace.command-runner';
import { RegisteredWorkspaceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-workspace-command.decorator';
import { getWorkspaceSchemaName } from 'src/engine/workspace-datasource/utils/get-workspace-schema-name.util';
import { ROBOOST_COMPANY_NAME_TRIGRAM_EXPRESSION } from 'src/modules/roboost-merge/utils/build-roboost-duplicate-candidate-queries.util';

// Fuzzy duplicate names need pg_trgm; the GIN index keeps the similar-name scan fast at tens of thousands of records
@RegisteredWorkspaceCommand('2.49.0', 1795648222603)
@Command({
  name: 'upgrade:2-49:enable-roboost-fuzzy-duplicates',
  description:
    'Enable the pg_trgm extension, add a trigram index on company names, and add the similarity threshold to duplicate settings',
})
export class EnableRoboostFuzzyDuplicatesCommand extends ProvisionedWorkspaceCommandRunner {
  constructor(
    protected readonly workspaceIteratorService: WorkspaceIteratorService,
  ) {
    super(workspaceIteratorService);
  }

  override async runOnWorkspace(args: RunOnWorkspaceArgs): Promise<void> {
    await this.up(args);
  }

  async up({ workspaceId, dataSource, options }: RunOnWorkspaceArgs) {
    if (!isDefined(dataSource)) {
      return;
    }

    const schema = `"${getWorkspaceSchemaName(workspaceId)}"`;

    if (options.dryRun) {
      this.logger.log(
        `[DRY RUN] Workspace ${workspaceId}: would enable pg_trgm and add the trigram index`,
      );

      return;
    }

    await dataSource.query('CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public');
    await dataSource.query(
      `ALTER TABLE ${schema}."roboostDuplicateSettings" ADD COLUMN IF NOT EXISTS "similarityThreshold" numeric`,
    );
    await dataSource.query(
      `CREATE INDEX IF NOT EXISTS "IDX_roboost_company_name_trgm" ON ${schema}."company" USING gin ((${ROBOOST_COMPANY_NAME_TRIGRAM_EXPRESSION}) public.gin_trgm_ops) WHERE "deletedAt" IS NULL`,
    );

    this.logger.log(
      `Workspace ${workspaceId}: pg_trgm enabled and trigram index added`,
    );
  }

  async down({ workspaceId, dataSource }: RunOnWorkspaceArgs) {
    if (!isDefined(dataSource)) {
      return;
    }

    const schema = `"${getWorkspaceSchemaName(workspaceId)}"`;

    await dataSource.query(
      `DROP INDEX IF EXISTS ${schema}."IDX_roboost_company_name_trgm"`,
    );
    await dataSource.query(
      `ALTER TABLE ${schema}."roboostDuplicateSettings" DROP COLUMN IF EXISTS "similarityThreshold"`,
    );
  }
}
