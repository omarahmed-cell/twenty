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
import { ACTIVITY_OBJECTS_FLAT_ENTITY_MAPS_KEYS } from 'src/database/commands/upgrade-version-command/2-49/utils/select-activity-objects-standard-additions.util';
import { ApplicationService } from 'src/engine/core-modules/application/application.service';
import { RegisteredWorkspaceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-workspace-command.decorator';
import { type FlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-maps.type';
import { type FlatObjectMetadata } from 'src/engine/metadata-modules/flat-object-metadata/types/flat-object-metadata.type';
import { WorkspaceCacheService } from 'src/engine/workspace-cache/services/workspace-cache.service';
import { computeTwentyStandardApplicationAllFlatEntityMaps } from 'src/engine/workspace-manager/twenty-standard-application/utils/twenty-standard-application-all-flat-entity-maps.constant';
import { WorkspaceMigrationValidateBuildAndRunService } from 'src/engine/workspace-manager/workspace-migration/services/workspace-migration-validate-build-and-run-service';

type ProvisionActivityPinCommandOptions = ProvisionedWorkspaceCommandOptions & {
  rollback?: boolean;
};

const ACTIVITY_PIN_OBJECT_NAMES = ['activityPin'] as const;

const ACTIVITY_PIN_SEED_UNIVERSAL_IDENTIFIERS = ACTIVITY_PIN_OBJECT_NAMES.map(
  (objectName) => STANDARD_OBJECTS[objectName].universalIdentifier,
);

const RESERVED_OBJECT_NAMES = new Set(
  ACTIVITY_PIN_OBJECT_NAMES.flatMap((objectName) => [
    objectName,
    `${objectName}s`,
  ]),
);

@RegisteredWorkspaceCommand('2.49.0', 1795388001616)
@Command({
  name: 'upgrade:2-49:provision-activity-pin',
  description:
    'Add the hidden Activity Pin object that pins activities to the top of a record timeline. Fails on a workspace that holds a custom object with the same name. Pass --rollback to remove what it added.',
})
export class ProvisionActivityPinCommand extends ProvisionedWorkspaceCommandRunner<ProvisionActivityPinCommandOptions> {
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
    description: 'Remove the metadata this command added',
    required: false,
  })
  parseRollback(): boolean {
    return true;
  }

  override async runOnWorkspace({
    workspaceId,
    options,
  }: RunOnWorkspaceArgs<ProvisionActivityPinCommandOptions>): Promise<void> {
    const dryRun = options.dryRun ?? false;
    const isRollback = options.rollback === true;

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

    if (!isRollback) {
      this.assertNoNameCollision({
        workspaceId,
        flatObjectMetadataMaps: existing.flatObjectMetadataMaps,
        twentyStandardApplicationUniversalIdentifier:
          twentyStandardFlatApplication.universalIdentifier,
      });
    }

    const {
      allFlatEntityMaps: standard,
      idByUniversalIdentifierByMetadataName,
    } = computeTwentyStandardApplicationAllFlatEntityMaps({
      now: new Date().toISOString(),
      workspaceId,
      twentyStandardApplicationId: twentyStandardFlatApplication.id,
    });

    let fromToAllFlatEntityMaps;
    let additionCount = 0;

    if (isRollback) {
      fromToAllFlatEntityMaps = buildSeededStandardRollbackFromTo({
        existing,
        standard,
        seedUniversalIdentifiers: ACTIVITY_PIN_SEED_UNIVERSAL_IDENTIFIERS,
      });
    } else {
      const provision = buildSeededStandardAdditionsFromTo({
        existing,
        standard,
        seedUniversalIdentifiers: ACTIVITY_PIN_SEED_UNIVERSAL_IDENTIFIERS,
      });

      additionCount = countSeededStandardAdditions(provision.additions);

      if (additionCount === 0) {
        return;
      }

      fromToAllFlatEntityMaps = provision.fromToAllFlatEntityMaps;
    }

    const result =
      await this.workspaceMigrationValidateBuildAndRunService.validateBuildAndRunWorkspaceMigrationFromTo(
        {
          workspaceId,
          dryRun,
          buildOptions: {
            isSystemBuild: true,
            inferDeletionFromMissingEntities: isRollback ? true : {},
            applicationUniversalIdentifier:
              twentyStandardFlatApplication.universalIdentifier,
          },
          additionalCacheDataMaps: {
            featureFlagsMap: existing.featureFlagsMap,
          },
          idByUniversalIdentifierByMetadataName,
          fromToAllFlatEntityMaps,
        },
      );

    if (result.status === 'fail') {
      throw new Error(
        `Activity pin ${isRollback ? 'rollback' : 'provisioning'} failed for workspace ${workspaceId}: ${JSON.stringify(result)}`,
      );
    }

    this.logger.log(
      `${dryRun ? '[DRY RUN] ' : ''}Workspace ${workspaceId}: ${isRollback ? 'activity pin rolled back' : `${additionCount} activity pin standard addition(s)`}`,
    );
  }

  async up(args: RunOnWorkspaceArgs<ProvisionActivityPinCommandOptions>) {
    await this.runOnWorkspace({
      ...args,
      options: { ...args.options, rollback: false },
    });
  }

  async down(args: RunOnWorkspaceArgs<ProvisionActivityPinCommandOptions>) {
    await this.runOnWorkspace({
      ...args,
      options: { ...args.options, rollback: true },
    });
  }

  private assertNoNameCollision({
    workspaceId,
    flatObjectMetadataMaps,
    twentyStandardApplicationUniversalIdentifier,
  }: {
    workspaceId: string;
    flatObjectMetadataMaps: FlatEntityMaps<FlatObjectMetadata>;
    twentyStandardApplicationUniversalIdentifier: string;
  }) {
    const collisions = Object.values(
      flatObjectMetadataMaps.byUniversalIdentifier,
    )
      .filter(isDefined)
      .filter(
        (flatObjectMetadata) =>
          flatObjectMetadata.applicationUniversalIdentifier !==
            twentyStandardApplicationUniversalIdentifier &&
          (RESERVED_OBJECT_NAMES.has(flatObjectMetadata.nameSingular) ||
            RESERVED_OBJECT_NAMES.has(flatObjectMetadata.namePlural)),
      )
      .map(({ nameSingular }) => nameSingular);

    if (collisions.length > 0) {
      throw new Error(
        `Workspace ${workspaceId} has custom objects (${collisions.join(', ')}) that collide with the activity pin object. Delete or rename them in Settings > Data model, then rerun the upgrade.`,
      );
    }
  }
}
