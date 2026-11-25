import { Command } from 'nest-commander';

import { ProvisionedWorkspaceCommandRunner } from 'src/database/commands/command-runners/provisioned-workspace.command-runner';
import { WorkspaceIteratorService } from 'src/database/commands/command-runners/workspace-iterator.service';
import { type RunOnWorkspaceArgs } from 'src/database/commands/command-runners/workspace.command-runner';
import { buildStandardRemovalFromTo } from 'src/database/commands/upgrade-version-command/2-49/utils/build-seeded-standard-additions-from-to.util';
import { ACTIVITY_OBJECTS_FLAT_ENTITY_MAPS_KEYS } from 'src/database/commands/upgrade-version-command/2-49/utils/select-activity-objects-standard-additions.util';
import { ApplicationService } from 'src/engine/core-modules/application/application.service';
import { RegisteredWorkspaceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-workspace-command.decorator';
import { WorkspaceCacheService } from 'src/engine/workspace-cache/services/workspace-cache.service';
import { getWorkspaceSchemaName } from 'src/engine/workspace-datasource/utils/get-workspace-schema-name.util';
import { WorkspaceMigrationValidateBuildAndRunService } from 'src/engine/workspace-manager/workspace-migration/services/workspace-migration-validate-build-and-run-service';

const HUBSPOT_TEAM_FIELDS = [
  { table: 'person', universalIdentifier: '4a38fc60-2cdb-4228-891e-b8490663612e' },
  {
    table: 'opportunity',
    universalIdentifier: 'df1a7520-16f7-4753-bd3b-66fdfdd15683',
  },
];

// HubSpot team values are not migrated; teams live in Users & Teams
@RegisteredWorkspaceCommand('2.49.0', 1795647999218)
@Command({
  name: 'upgrade:2-49:remove-hubspot-team-fields',
  description:
    'Remove the HubSpot "Team" select fields from contacts and deals. Refuses to run while either field holds a value.',
})
export class RemoveHubspotTeamFieldsCommand extends ProvisionedWorkspaceCommandRunner {
  constructor(
    protected readonly workspaceIteratorService: WorkspaceIteratorService,
    private readonly applicationService: ApplicationService,
    private readonly workspaceCacheService: WorkspaceCacheService,
    private readonly workspaceMigrationValidateBuildAndRunService: WorkspaceMigrationValidateBuildAndRunService,
  ) {
    super(workspaceIteratorService);
  }

  override async runOnWorkspace(args: RunOnWorkspaceArgs): Promise<void> {
    await this.up(args);
  }

  async up({ workspaceId, dataSource, options }: RunOnWorkspaceArgs) {
    const dryRun = options.dryRun ?? false;
    const schemaName = getWorkspaceSchemaName(workspaceId);

    for (const { table } of HUBSPOT_TEAM_FIELDS) {
      const [column] = (await dataSource?.query(
        `SELECT 1 FROM information_schema.columns WHERE table_schema = $1 AND table_name = $2 AND column_name = 'team'`,
        [schemaName, table],
      )) ?? [undefined];

      if (column === undefined) {
        continue;
      }

      const [{ count }] = await dataSource!.query(
        `SELECT count(*)::int AS count FROM "${schemaName}"."${table}" WHERE "team" IS NOT NULL`,
      );

      if (count > 0) {
        throw new Error(
          `Workspace ${workspaceId}: ${count} ${table} records still have a Team value, so the field is kept`,
        );
      }
    }

    const { twentyStandardFlatApplication } =
      await this.applicationService.findWorkspaceTwentyStandardAndCustomApplicationOrThrow(
        { workspaceId },
      );
    const existing = structuredClone(
      await this.workspaceCacheService.getOrRecompute(workspaceId, [
        ...ACTIVITY_OBJECTS_FLAT_ENTITY_MAPS_KEYS,
        'featureFlagsMap',
      ]),
    );
    const { fromToAllFlatEntityMaps, removedUniversalIdentifiers } =
      buildStandardRemovalFromTo({
        existing,
        universalIdentifiers: HUBSPOT_TEAM_FIELDS.map(
          ({ universalIdentifier }) => universalIdentifier,
        ),
      });

    if (removedUniversalIdentifiers.length === 0) {
      return;
    }

    const result =
      await this.workspaceMigrationValidateBuildAndRunService.validateBuildAndRunWorkspaceMigrationFromTo(
        {
          workspaceId,
          dryRun,
          buildOptions: {
            isSystemBuild: true,
            inferDeletionFromMissingEntities: true,
            applicationUniversalIdentifier:
              twentyStandardFlatApplication.universalIdentifier,
          },
          additionalCacheDataMaps: {
            featureFlagsMap: existing.featureFlagsMap,
          },
          fromToAllFlatEntityMaps,
        },
      );

    if (result.status === 'fail') {
      throw new Error(
        `Removing the HubSpot Team fields failed for workspace ${workspaceId}: ${JSON.stringify(result)}`,
      );
    }

    this.logger.log(
      `${dryRun ? '[DRY RUN] ' : ''}Workspace ${workspaceId}: removed ${removedUniversalIdentifiers.length} Team field metadata entities`,
    );
  }

  async down() {
    // Both fields were empty when removed; adding them back would only bring back empty fields
  }
}
