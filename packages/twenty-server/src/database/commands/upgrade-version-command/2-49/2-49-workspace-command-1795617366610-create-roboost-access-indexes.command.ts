import { Command } from 'nest-commander';
import { isDefined } from 'twenty-shared/utils';

import { ProvisionedWorkspaceCommandRunner } from 'src/database/commands/command-runners/provisioned-workspace.command-runner';
import { WorkspaceIteratorService } from 'src/database/commands/command-runners/workspace-iterator.service';
import { type RunOnWorkspaceArgs } from 'src/database/commands/command-runners/workspace.command-runner';
import { RegisteredWorkspaceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-workspace-command.decorator';
import { getWorkspaceSchemaName } from 'src/engine/workspace-datasource/utils/get-workspace-schema-name.util';

// Columns the per-user record checks filter on that have no index yet
const ROBOOST_ACCESS_INDEXES: { tableName: string; columnName: string }[] = [
  { tableName: 'opportunity', columnName: 'ownerId' },
  { tableName: 'teamMembership', columnName: 'teamId' },
  ...['task', 'note', 'email', 'meeting', 'call', 'communication'].map(
    (tableName) => ({ tableName, columnName: 'createdByWorkspaceMemberId' }),
  ),
];

const toIndexName = ({
  tableName,
  columnName,
}: {
  tableName: string;
  columnName: string;
}) => `IDX_roboost_access_${tableName}_${columnName}`;

@RegisteredWorkspaceCommand('2.49.0', 1795617366610)
@Command({
  name: 'upgrade:2-49:create-roboost-access-indexes',
  description:
    'Index the owner, creator and team columns that per-user record permissions filter on',
})
export class CreateRoboostAccessIndexesCommand extends ProvisionedWorkspaceCommandRunner {
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

    const schemaName = getWorkspaceSchemaName(workspaceId);

    for (const index of ROBOOST_ACCESS_INDEXES) {
      const [{ hasColumn }] = await dataSource.query(
        `SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = $1 AND table_name = $2 AND column_name = $3) AS "hasColumn"`,
        [schemaName, index.tableName, index.columnName],
      );

      if (hasColumn !== true) {
        continue;
      }

      if (options.dryRun) {
        this.logger.log(`[DRY RUN] would create ${toIndexName(index)}`);
        continue;
      }

      await dataSource.query(
        `CREATE INDEX IF NOT EXISTS "${toIndexName(index)}" ON "${schemaName}"."${index.tableName}" ("${index.columnName}")`,
      );
    }

    this.logger.log(`Workspace ${workspaceId}: access indexes ready`);
  }

  async down({ workspaceId, dataSource }: RunOnWorkspaceArgs): Promise<void> {
    if (!isDefined(dataSource)) {
      return;
    }

    const schemaName = getWorkspaceSchemaName(workspaceId);

    for (const index of ROBOOST_ACCESS_INDEXES) {
      await dataSource.query(
        `DROP INDEX IF EXISTS "${schemaName}"."${toIndexName(index)}"`,
      );
    }
  }
}
