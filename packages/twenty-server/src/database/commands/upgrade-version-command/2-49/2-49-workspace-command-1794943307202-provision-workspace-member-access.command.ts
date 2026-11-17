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
import { computeTwentyStandardApplicationAllFlatEntityMaps } from 'src/engine/workspace-manager/twenty-standard-application/utils/twenty-standard-application-all-flat-entity-maps.constant';
import { WorkspaceMigrationValidateBuildAndRunService } from 'src/engine/workspace-manager/workspace-migration/services/workspace-migration-validate-build-and-run-service';

type ProvisionWorkspaceMemberAccessCommandOptions =
  ProvisionedWorkspaceCommandOptions & {
    rollback?: boolean;
  };

const WORKSPACE_MEMBER_ACCESS_FIELD_NAMES = [
  'memberStatus',
  'isPreCreated',
] as const;

const WORKSPACE_MEMBER_ACCESS_SEED_UNIVERSAL_IDENTIFIERS =
  WORKSPACE_MEMBER_ACCESS_FIELD_NAMES.map(
    (fieldName) =>
      STANDARD_OBJECTS.workspaceMember.fields[fieldName].universalIdentifier,
  );

// Both columns are NOT NULL with a default, so adding them leaves every existing member ACTIVE and not pre-created
@RegisteredWorkspaceCommand('2.49.0', 1794943307202)
@Command({
  name: 'upgrade:2-49:provision-workspace-member-access',
  description:
    'Add the Status (memberStatus) and Pre-created (isPreCreated) fields to workspace members; existing members become Active and not pre-created. Fails on a workspace that holds custom fields with the same names. Pass --rollback to remove the fields.',
})
export class ProvisionWorkspaceMemberAccessCommand extends ProvisionedWorkspaceCommandRunner<ProvisionWorkspaceMemberAccessCommandOptions> {
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
    args: RunOnWorkspaceArgs<ProvisionWorkspaceMemberAccessCommandOptions>,
  ): Promise<void> {
    if (args.options.rollback === true) {
      await this.down(args);

      return;
    }

    await this.up(args);
  }

  async up({
    workspaceId,
    options,
  }: RunOnWorkspaceArgs<ProvisionWorkspaceMemberAccessCommandOptions>) {
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
        WORKSPACE_MEMBER_ACCESS_SEED_UNIVERSAL_IDENTIFIERS,
    });
    const additionCount = countSeededStandardAdditions(provision.additions);

    if (additionCount === 0) {
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
        `Workspace member access provisioning failed for workspace ${workspaceId}: ${JSON.stringify(result)}`,
      );
    }

    if (!dryRun) {
      await this.workspaceCacheService.invalidateAndRecompute(workspaceId, [
        'flatWorkspaceMemberMaps',
      ]);
    }

    this.logger.log(
      `${dryRun ? '[DRY RUN] ' : ''}Workspace ${workspaceId}: ${additionCount} workspace member access standard addition(s)`,
    );
  }

  async down({
    workspaceId,
    options,
  }: RunOnWorkspaceArgs<ProvisionWorkspaceMemberAccessCommandOptions>) {
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
              WORKSPACE_MEMBER_ACCESS_SEED_UNIVERSAL_IDENTIFIERS,
          }),
        },
      );

    if (result.status === 'fail') {
      throw new Error(
        `Workspace member access rollback failed for workspace ${workspaceId}: ${JSON.stringify(result)}`,
      );
    }

    if (!dryRun) {
      await this.workspaceCacheService.invalidateAndRecompute(workspaceId, [
        'flatWorkspaceMemberMaps',
      ]);
    }

    this.logger.log(
      `${dryRun ? '[DRY RUN] ' : ''}Workspace ${workspaceId}: workspace member access rolled back`,
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
    const reservedFieldNames: readonly string[] =
      WORKSPACE_MEMBER_ACCESS_FIELD_NAMES;

    const collisions = Object.values(
      existing.flatFieldMetadataMaps.byUniversalIdentifier,
    )
      .filter(isDefined)
      .filter(
        (flatFieldMetadata) =>
          flatFieldMetadata.applicationUniversalIdentifier !==
            twentyStandardApplicationUniversalIdentifier &&
          flatFieldMetadata.objectMetadataUniversalIdentifier ===
            STANDARD_OBJECTS.workspaceMember.universalIdentifier &&
          reservedFieldNames.includes(flatFieldMetadata.name),
      )
      .map(({ name }) => name);

    if (collisions.length > 0) {
      throw new Error(
        `Workspace ${workspaceId} has custom workspace member fields (${collisions.join(', ')}) that collide with the native Status and Pre-created fields. Delete or rename them in Settings > Data model, then rerun the upgrade.`,
      );
    }
  }
}
