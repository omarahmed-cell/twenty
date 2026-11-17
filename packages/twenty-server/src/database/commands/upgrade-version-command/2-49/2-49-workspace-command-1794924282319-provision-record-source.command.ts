import { Command, Option } from 'nest-commander';
import { RECORD_SOURCE_OBJECT_NAMES } from 'twenty-shared/constants';
import { STANDARD_OBJECTS } from 'twenty-shared/metadata';
import { isDefined } from 'twenty-shared/utils';

import {
  ProvisionedWorkspaceCommandRunner,
  type ProvisionedWorkspaceCommandOptions,
} from 'src/database/commands/command-runners/provisioned-workspace.command-runner';
import { WorkspaceIteratorService } from 'src/database/commands/command-runners/workspace-iterator.service';
import { type RunOnWorkspaceArgs } from 'src/database/commands/command-runners/workspace.command-runner';
import {
  buildSeededStandardAdditionsFromTo,
  buildSeededStandardRollbackFromTo,
  countSeededStandardAdditions,
} from 'src/database/commands/upgrade-version-command/2-49/utils/build-seeded-standard-additions-from-to.util';
import {
  ACTIVITY_OBJECTS_FLAT_ENTITY_MAPS_KEYS,
  type ActivityObjectsFlatEntityMaps,
} from 'src/database/commands/upgrade-version-command/2-49/utils/select-activity-objects-standard-additions.util';
import { ApplicationService } from 'src/engine/core-modules/application/application.service';
import { RegisteredWorkspaceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-workspace-command.decorator';
import { WorkspaceCacheService } from 'src/engine/workspace-cache/services/workspace-cache.service';
import { getWorkspaceSchemaName } from 'src/engine/workspace-datasource/utils/get-workspace-schema-name.util';
import { computeTwentyStandardApplicationAllFlatEntityMaps } from 'src/engine/workspace-manager/twenty-standard-application/utils/twenty-standard-application-all-flat-entity-maps.constant';
import { WorkspaceMigrationValidateBuildAndRunService } from 'src/engine/workspace-manager/workspace-migration/services/workspace-migration-validate-build-and-run-service';

type ProvisionRecordSourceCommandOptions =
  ProvisionedWorkspaceCommandOptions & {
    rollback?: boolean;
  };

const RECORD_SOURCE_SEED_UNIVERSAL_IDENTIFIERS = RECORD_SOURCE_OBJECT_NAMES.map(
  (objectName) =>
    STANDARD_OBJECTS[objectName].fields.recordSource.universalIdentifier,
);

@RegisteredWorkspaceCommand('2.49.0', 1794924282319)
@Command({
  name: 'upgrade:2-49:provision-record-source',
  description:
    'Add the read-only Record source field to companies, people, deals, services, calls, meetings, notes, tasks, emails and communications, and fill it for existing records from how they were created. Fails on a workspace that holds custom recordSource fields on those objects. Pass --rollback to remove the fields.',
})
export class ProvisionRecordSourceCommand extends ProvisionedWorkspaceCommandRunner<ProvisionRecordSourceCommandOptions> {
  constructor(
    protected readonly workspaceIteratorService: WorkspaceIteratorService,
    private readonly applicationService: ApplicationService,
    private readonly workspaceCacheService: WorkspaceCacheService,
    private readonly workspaceMigrationValidateBuildAndRunService: WorkspaceMigrationValidateBuildAndRunService,
  ) {
    super(workspaceIteratorService);
  }

  @Option({
    flags: '--rollback',
    description: 'Remove the fields this command added',
    required: false,
  })
  parseRollback(): boolean {
    return true;
  }

  override async runOnWorkspace(
    args: RunOnWorkspaceArgs<ProvisionRecordSourceCommandOptions>,
  ): Promise<void> {
    if (args.options.rollback === true) {
      await this.down(args);

      return;
    }

    await this.up(args);
  }

  async up({
    workspaceId,
    dataSource,
    options,
  }: RunOnWorkspaceArgs<ProvisionRecordSourceCommandOptions>) {
    const dryRun = options.dryRun ?? false;

    if (!isDefined(dataSource)) {
      throw new Error(`Workspace ${workspaceId}: no data source`);
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

    this.assertNoNameCollision({
      workspaceId,
      existing,
      twentyStandardApplicationUniversalIdentifier:
        twentyStandardFlatApplication.universalIdentifier,
    });

    const {
      allFlatEntityMaps: standard,
      idByUniversalIdentifierByMetadataName,
    } = computeTwentyStandardApplicationAllFlatEntityMaps({
      now: new Date().toISOString(),
      workspaceId,
      twentyStandardApplicationId: twentyStandardFlatApplication.id,
    });

    const provision = buildSeededStandardAdditionsFromTo({
      existing,
      standard,
      seedUniversalIdentifiers: RECORD_SOURCE_SEED_UNIVERSAL_IDENTIFIERS,
    });
    const additionCount = countSeededStandardAdditions(provision.additions);

    if (dryRun) {
      this.logger.log(
        `[DRY RUN] Workspace ${workspaceId}: ${additionCount} record source standard addition(s)`,
      );

      return;
    }

    if (additionCount > 0) {
      const result =
        await this.workspaceMigrationValidateBuildAndRunService.validateBuildAndRunWorkspaceMigrationFromTo(
          {
            workspaceId,
            buildOptions: {
              isSystemBuild: true,
              inferDeletionFromMissingEntities: {},
              applicationUniversalIdentifier:
                twentyStandardFlatApplication.universalIdentifier,
            },
            additionalCacheDataMaps: {
              featureFlagsMap: existing.featureFlagsMap,
            },
            idByUniversalIdentifierByMetadataName,
            fromToAllFlatEntityMaps: provision.fromToAllFlatEntityMaps,
          },
        );

      if (result.status === 'fail') {
        throw new Error(
          `Record source provisioning failed for workspace ${workspaceId}: ${JSON.stringify(result)}`,
        );
      }
    }

    const schemaName = getWorkspaceSchemaName(workspaceId);
    const backfillCounts: Record<string, number> = {};

    for (const objectName of RECORD_SOURCE_OBJECT_NAMES) {
      const [column]: { udt_name: string }[] = await dataSource.query(
        `SELECT "udt_name" FROM "information_schema"."columns"
        WHERE "table_schema" = $1 AND "table_name" = $2 AND "column_name" = 'recordSource'`,
        [schemaName, objectName],
      );

      if (!isDefined(column)) {
        continue;
      }

      // Enum to enum has no cast, so the value goes through text
      const [, count]: [unknown, number] = await dataSource.query(
        `UPDATE "${schemaName}"."${objectName}"
        SET "recordSource" = "createdBySource"::text::"${schemaName}"."${column.udt_name}"
        WHERE "recordSource" IS NULL AND "createdBySource" IS NOT NULL`,
      );

      backfillCounts[objectName] = count;
    }

    this.logger.log(
      `Workspace ${workspaceId}: ${additionCount} record source standard addition(s), records filled ${JSON.stringify(backfillCounts)}`,
    );
  }

  async down({
    workspaceId,
    options,
  }: RunOnWorkspaceArgs<ProvisionRecordSourceCommandOptions>) {
    if (options.dryRun ?? false) {
      return;
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
    const {
      allFlatEntityMaps: standard,
      idByUniversalIdentifierByMetadataName,
    } = computeTwentyStandardApplicationAllFlatEntityMaps({
      now: new Date().toISOString(),
      workspaceId,
      twentyStandardApplicationId: twentyStandardFlatApplication.id,
    });

    const result =
      await this.workspaceMigrationValidateBuildAndRunService.validateBuildAndRunWorkspaceMigrationFromTo(
        {
          workspaceId,
          buildOptions: {
            isSystemBuild: true,
            inferDeletionFromMissingEntities: true,
            applicationUniversalIdentifier:
              twentyStandardFlatApplication.universalIdentifier,
          },
          additionalCacheDataMaps: {
            featureFlagsMap: existing.featureFlagsMap,
          },
          idByUniversalIdentifierByMetadataName,
          fromToAllFlatEntityMaps: buildSeededStandardRollbackFromTo({
            existing,
            standard,
            seedUniversalIdentifiers: RECORD_SOURCE_SEED_UNIVERSAL_IDENTIFIERS,
          }),
        },
      );

    if (result.status === 'fail') {
      throw new Error(
        `Record source rollback failed for workspace ${workspaceId}: ${JSON.stringify(result)}`,
      );
    }

    this.logger.log(`Workspace ${workspaceId}: record source rolled back`);
  }

  private assertNoNameCollision({
    workspaceId,
    existing,
    twentyStandardApplicationUniversalIdentifier,
  }: {
    workspaceId: string;
    existing: Pick<ActivityObjectsFlatEntityMaps, 'flatFieldMetadataMaps'>;
    twentyStandardApplicationUniversalIdentifier: string;
  }) {
    const recordSourceObjectUniversalIdentifiers = new Set<string>(
      RECORD_SOURCE_OBJECT_NAMES.map(
        (objectName) => STANDARD_OBJECTS[objectName].universalIdentifier,
      ),
    );

    const collidingObjectUniversalIdentifiers = Object.values(
      existing.flatFieldMetadataMaps.byUniversalIdentifier,
    )
      .filter(isDefined)
      .filter(
        (flatFieldMetadata) =>
          flatFieldMetadata.applicationUniversalIdentifier !==
            twentyStandardApplicationUniversalIdentifier &&
          flatFieldMetadata.name === 'recordSource' &&
          recordSourceObjectUniversalIdentifiers.has(
            flatFieldMetadata.objectMetadataUniversalIdentifier,
          ),
      )
      .map(
        ({ objectMetadataUniversalIdentifier }) =>
          objectMetadataUniversalIdentifier,
      );

    if (collidingObjectUniversalIdentifiers.length > 0) {
      throw new Error(
        `Workspace ${workspaceId} has custom recordSource fields on objects ${collidingObjectUniversalIdentifiers.join(', ')} that collide with the native Record source field. Delete or rename them in Settings > Data model, then rerun the upgrade.`,
      );
    }
  }
}
