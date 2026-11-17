import { Command } from 'nest-commander';
import { isDefined } from 'twenty-shared/utils';

import { ProvisionedWorkspaceCommandRunner } from 'src/database/commands/command-runners/provisioned-workspace.command-runner';
import { WorkspaceIteratorService } from 'src/database/commands/command-runners/workspace-iterator.service';
import { type RunOnWorkspaceArgs } from 'src/database/commands/command-runners/workspace.command-runner';
import { RegisteredWorkspaceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-workspace-command.decorator';
import { getWorkspaceSchemaName } from 'src/engine/workspace-datasource/utils/get-workspace-schema-name.util';

const NEW_ACTOR_SOURCE_VALUES = ['FORMS', 'DOCUMENT_APP'];

// Enum names are truncated by Postgres, so actor source enums are found by their values
const ACTOR_SOURCE_MARKER_VALUES = [
  'MANUAL',
  'API',
  'IMPORT',
  'WEBHOOK',
  'APPLICATION',
];

@RegisteredWorkspaceCommand('2.49.0', 1794924166804)
@Command({
  name: 'upgrade:2-49:add-actor-source-values',
  description:
    'Add the FORMS and DOCUMENT_APP values to every actor source enum (createdBy, updatedBy, changedBy and the like) so records can be attributed to forms and the document app.',
})
export class AddActorSourceValuesCommand extends ProvisionedWorkspaceCommandRunner {
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
      throw new Error(`Workspace ${workspaceId}: no data source`);
    }

    const schemaName = getWorkspaceSchemaName(workspaceId);

    const actorSourceEnums: { typname: string }[] = await dataSource.query(
      `SELECT t.typname
      FROM pg_type t
      JOIN pg_namespace n ON n.oid = t.typnamespace
      WHERE t.typtype = 'e'
        AND n.nspname = $1
        AND (
          SELECT array_agg(e.enumlabel::text)
          FROM pg_enum e
          WHERE e.enumtypid = t.oid
        ) @> $2::text[]
        AND NOT (
          SELECT array_agg(e.enumlabel::text)
          FROM pg_enum e
          WHERE e.enumtypid = t.oid
        ) @> $3::text[]`,
      [schemaName, ACTOR_SOURCE_MARKER_VALUES, NEW_ACTOR_SOURCE_VALUES],
    );

    if (options.dryRun ?? false) {
      this.logger.log(
        `[DRY RUN] Workspace ${workspaceId}: ${actorSourceEnums.length} actor source enum(s) to extend`,
      );

      return;
    }

    // ADD VALUE cannot run inside a transaction block on older Postgres, so each runs on its own
    for (const { typname } of actorSourceEnums) {
      for (const value of NEW_ACTOR_SOURCE_VALUES) {
        await dataSource.query(
          `ALTER TYPE "${schemaName}"."${typname}" ADD VALUE IF NOT EXISTS '${value}'`,
        );
      }
    }

    this.logger.log(
      `Workspace ${workspaceId}: ${actorSourceEnums.length} actor source enum(s) extended`,
    );
  }

  // Postgres cannot drop an enum value, and records may already use the new ones
  async down({ workspaceId }: RunOnWorkspaceArgs) {
    this.logger.log(
      `Workspace ${workspaceId}: actor source values are kept, Postgres cannot drop enum values`,
    );
  }
}
