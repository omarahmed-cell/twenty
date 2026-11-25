import { Command, Option } from 'nest-commander';
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

type ProvisionMergeCommandOptions =
  ProvisionedWorkspaceCommandOptions & {
    rollback?: boolean;
  };

const MERGE_OBJECT_NAMES = [
  'company',
  'person',
  'opportunity',
  'service',
] as const;

const MERGED_RECORD_IDS_SEED_UNIVERSAL_IDENTIFIERS = MERGE_OBJECT_NAMES.map(
  (objectName) =>
    STANDARD_OBJECTS[objectName].fields.mergedRecordIds.universalIdentifier,
);

@RegisteredWorkspaceCommand('2.49.0', 1795630106025)
@Command({
  name: 'upgrade:2-49:provision-merge',
  description:
    'Add the read-only Merged IDs field to companies, contacts, deals and services, and create the merge log table. Pass --rollback to remove them.',
})
export class ProvisionMergeCommand extends ProvisionedWorkspaceCommandRunner<ProvisionMergeCommandOptions> {
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
    args: RunOnWorkspaceArgs<ProvisionMergeCommandOptions>,
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
  }: RunOnWorkspaceArgs<ProvisionMergeCommandOptions>) {
    const dryRun = options.dryRun ?? false;

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
      seedUniversalIdentifiers:
        MERGED_RECORD_IDS_SEED_UNIVERSAL_IDENTIFIERS,
    });
    const additionCount = countSeededStandardAdditions(provision.additions);

    if (additionCount === 0) {
      if (!dryRun && isDefined(dataSource)) {
        await this.createMergeLogTable(dataSource, workspaceId);
      }

      return;
    }

    const result =
      await this.workspaceMigrationValidateBuildAndRunService.validateBuildAndRunWorkspaceMigrationFromTo(
        {
          workspaceId,
          dryRun,
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
        `Merge provisioning failed for workspace ${workspaceId}: ${JSON.stringify(result)}`,
      );
    }

    if (!dryRun) {
      await this.workspaceCacheService.invalidateAndRecompute(workspaceId, [
        'flatWorkspaceMemberMaps',
      ]);

      if (isDefined(dataSource)) {
        await this.createMergeLogTable(dataSource, workspaceId);
      }
    }

    this.logger.log(
      `${dryRun ? '[DRY RUN] ' : ''}Workspace ${workspaceId}: ${additionCount} merge standard addition(s)`,
    );
  }

  async down({
    workspaceId,
    options,
  }: RunOnWorkspaceArgs<ProvisionMergeCommandOptions>) {
    const dryRun = options.dryRun ?? false;

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
          idByUniversalIdentifierByMetadataName,
          fromToAllFlatEntityMaps: buildSeededStandardRollbackFromTo({
            existing,
            standard,
            seedUniversalIdentifiers:
              MERGED_RECORD_IDS_SEED_UNIVERSAL_IDENTIFIERS,
          }),
        },
      );

    if (result.status === 'fail') {
      throw new Error(
        `Merge rollback failed for workspace ${workspaceId}: ${JSON.stringify(result)}`,
      );
    }

    if (!dryRun) {
      await this.workspaceCacheService.invalidateAndRecompute(workspaceId, [
        'flatWorkspaceMemberMaps',
      ]);
    }

    this.logger.log(
      `${dryRun ? '[DRY RUN] ' : ''}Workspace ${workspaceId}: merge fields rolled back`,
    );
  }

  // Plain table, like scores: hidden from navigation, the data model and the API
  private async createMergeLogTable(
    dataSource: NonNullable<RunOnWorkspaceArgs['dataSource']>,
    workspaceId: string,
  ) {
    const schema = `"${getWorkspaceSchemaName(workspaceId)}"`;

    await dataSource.query(`
      CREATE TABLE IF NOT EXISTS ${schema}."roboostMergeLog" (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "objectName" text NOT NULL,
        "primaryId" uuid NOT NULL,
        "secondaryId" uuid NOT NULL,
        "primaryName" text,
        "secondaryName" text,
        "mergedById" uuid,
        "mergedByName" text,
        "mergedAt" timestamptz NOT NULL DEFAULT now(),
        "isBulk" boolean NOT NULL DEFAULT false,
        status text NOT NULL DEFAULT 'MERGED',
        "secondarySnapshot" jsonb,
        "primaryBefore" jsonb,
        "primaryChanges" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "movedLinks" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "segmentMembershipsAdded" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "unmergedAt" timestamptz,
        "unmergedById" uuid,
        "unmergedByName" text,
        "expiredAt" timestamptz
      )`);
    await dataSource.query(
      `CREATE INDEX IF NOT EXISTS "IDX_roboostMergeLog_primary" ON ${schema}."roboostMergeLog" ("primaryId", "mergedAt" DESC)`,
    );
    await dataSource.query(
      `CREATE INDEX IF NOT EXISTS "IDX_roboostMergeLog_secondary" ON ${schema}."roboostMergeLog" ("secondaryId")`,
    );
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
    const mergeObjectUniversalIdentifiers = new Set<string>(
      MERGE_OBJECT_NAMES.map(
        (objectName) => STANDARD_OBJECTS[objectName].universalIdentifier,
      ),
    );
    const collisions = Object.values(
      existing.flatFieldMetadataMaps.byUniversalIdentifier,
    )
      .filter(isDefined)
      .filter(
        (flatFieldMetadata) =>
          flatFieldMetadata.applicationUniversalIdentifier !==
            twentyStandardApplicationUniversalIdentifier &&
          mergeObjectUniversalIdentifiers.has(
            flatFieldMetadata.objectMetadataUniversalIdentifier,
          ) &&
          flatFieldMetadata.name === 'mergedRecordIds',
      )
      .map(({ name }) => name);

    if (collisions.length > 0) {
      throw new Error(
        `Workspace ${workspaceId} has custom mergedRecordIds fields that collide with the native Merged IDs field. Delete or rename them in Settings > Data model, then rerun the upgrade.`,
      );
    }
  }
}
