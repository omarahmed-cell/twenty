import { Command, Option } from 'nest-commander';
import { isDefined } from 'twenty-shared/utils';

import {
  ProvisionedWorkspaceCommandRunner,
  type ProvisionedWorkspaceCommandOptions,
} from 'src/database/commands/command-runners/provisioned-workspace.command-runner';
import { WorkspaceIteratorService } from 'src/database/commands/command-runners/workspace-iterator.service';
import { type RunOnWorkspaceArgs } from 'src/database/commands/command-runners/workspace.command-runner';
import {
  ACTIVITY_OBJECTS_FLAT_ENTITY_MAPS_KEYS,
  type ActivityObjectsFlatEntityMaps,
  collectParentReferences,
} from 'src/database/commands/upgrade-version-command/2-49/utils/select-activity-objects-standard-additions.util';
import {
  CATALOG_OBJECT_UNIVERSAL_IDENTIFIERS,
  selectCatalogObjectsStandardAdditions,
} from 'src/database/commands/upgrade-version-command/2-49/utils/select-catalog-objects-standard-additions.util';
import { ApplicationService } from 'src/engine/core-modules/application/application.service';
import { type FlatApplication } from 'src/engine/core-modules/application/types/flat-application.type';
import { RegisteredWorkspaceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-workspace-command.decorator';
import { type SyncableFlatEntity } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-from.type';
import { type FlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-maps.type';
import { computeMissingInitialObjectViewOperations } from 'src/engine/metadata-modules/view/utils/compute-missing-initial-object-view-operations.util';
import { WorkspaceCacheService } from 'src/engine/workspace-cache/services/workspace-cache.service';
import { computeTwentyStandardApplicationAllFlatEntityMaps } from 'src/engine/workspace-manager/twenty-standard-application/utils/twenty-standard-application-all-flat-entity-maps.constant';
import { WorkspaceMigrationValidateBuildAndRunService } from 'src/engine/workspace-manager/workspace-migration/services/workspace-migration-validate-build-and-run-service';
import { type FromToAllUniversalFlatEntityMaps } from 'src/engine/workspace-manager/workspace-migration/types/workspace-migration-orchestrator.type';

type ProvisionCatalogObjectsCommandOptions =
  ProvisionedWorkspaceCommandOptions & { rollback?: boolean };

const CATALOG_OBJECT_NAMES = ['product', 'lineItem'];

const addFlatEntities = <T extends SyncableFlatEntity>(
  flatEntityMaps: FlatEntityMaps<T>,
  flatEntities: T[],
): FlatEntityMaps<T> =>
  flatEntities.reduce(
    (maps, flatEntity) => ({
      byUniversalIdentifier: {
        ...maps.byUniversalIdentifier,
        [flatEntity.universalIdentifier]: flatEntity,
      },
      universalIdentifierById: {
        ...maps.universalIdentifierById,
        [flatEntity.id]: flatEntity.universalIdentifier,
      },
      universalIdentifiersByApplicationId: {
        ...maps.universalIdentifiersByApplicationId,
        [flatEntity.applicationId]: Array.from(
          new Set([
            ...(maps.universalIdentifiersByApplicationId[
              flatEntity.applicationId
            ] ?? []),
            flatEntity.universalIdentifier,
          ]),
        ),
      },
    }),
    flatEntityMaps,
  );

const removeFlatEntities = <T extends SyncableFlatEntity>(
  flatEntityMaps: FlatEntityMaps<T>,
  universalIdentifiers: Set<string>,
): FlatEntityMaps<T> => ({
  byUniversalIdentifier: Object.fromEntries(
    Object.entries(flatEntityMaps.byUniversalIdentifier).filter(
      ([universalIdentifier]) => !universalIdentifiers.has(universalIdentifier),
    ),
  ),
  universalIdentifierById: Object.fromEntries(
    Object.entries(flatEntityMaps.universalIdentifierById).filter(
      ([, universalIdentifier]) =>
        !isDefined(universalIdentifier) ||
        !universalIdentifiers.has(universalIdentifier),
    ),
  ),
  universalIdentifiersByApplicationId: Object.fromEntries(
    Object.entries(flatEntityMaps.universalIdentifiersByApplicationId).map(
      ([applicationId, applicationUniversalIdentifiers]) => [
        applicationId,
        (applicationUniversalIdentifiers ?? []).filter(
          (universalIdentifier) =>
            !universalIdentifiers.has(universalIdentifier),
        ),
      ],
    ),
  ),
});

// Workspaces created before the catalog get the Product and Line Item standard objects the same
// way provision-activity-objects added Service: an additive from/to migration over the standard
// definitions, plus the initial views workspace creation gives every object
@RegisteredWorkspaceCommand('2.49.0', 1792956108196)
@Command({
  name: 'upgrade:2-49:provision-catalog-objects',
  description:
    'Create the Product and Line Item standard objects (fields, views, record pages, navigation), the Deal lineItems relation and the Deal "Line of Item" tab in existing workspaces. Fails on a workspace that still holds a custom product/lineItem object. Pass --rollback to remove what it added.',
})
export class ProvisionCatalogObjectsCommand extends ProvisionedWorkspaceCommandRunner<ProvisionCatalogObjectsCommandOptions> {
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

  override async runOnWorkspace(
    args: RunOnWorkspaceArgs<ProvisionCatalogObjectsCommandOptions>,
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
  }: RunOnWorkspaceArgs<ProvisionCatalogObjectsCommandOptions>): Promise<void> {
    const dryRun = options.dryRun ?? false;

    const { twentyStandardFlatApplication } =
      await this.applicationService.findWorkspaceTwentyStandardAndCustomApplicationOrThrow(
        { workspaceId },
      );

    await this.assertNoCatalogObjectNameCollision({
      workspaceId,
      twentyStandardFlatApplication,
    });

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

    const { additions, droppedTabUniversalIdentifiers } =
      selectCatalogObjectsStandardAdditions({ existing, standard });

    if (droppedTabUniversalIdentifiers.length > 0) {
      this.logger.warn(
        `Workspace ${workspaceId}: skipped ${droppedTabUniversalIdentifiers.length} tab(s) whose record page layout is missing: ${droppedTabUniversalIdentifiers.join(', ')}`,
      );
    }

    const additionCount = Object.values(additions).reduce(
      (total, flatEntities) => total + flatEntities.length,
      0,
    );

    if (additionCount > 0) {
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
            fromToAllFlatEntityMaps: Object.fromEntries(
              ACTIVITY_OBJECTS_FLAT_ENTITY_MAPS_KEYS.map((mapsKey) => [
                mapsKey,
                {
                  from: existing[mapsKey],
                  to: addFlatEntities(
                    existing[mapsKey] as FlatEntityMaps<SyncableFlatEntity>,
                    additions[mapsKey] as SyncableFlatEntity[],
                  ),
                },
              ]),
            ) as FromToAllUniversalFlatEntityMaps,
          },
        );

      if (result.status === 'fail') {
        throw new Error(
          `Catalog objects provisioning failed for workspace ${workspaceId}: ${JSON.stringify(result)}`,
        );
      }

      this.logger.log(
        `${dryRun ? '[DRY RUN] ' : ''}Workspace ${workspaceId}: ${additionCount} catalog standard addition(s) (${Object.entries(
          additions,
        )
          .filter(([, flatEntities]) => flatEntities.length > 0)
          .map(([mapsKey, flatEntities]) => `${mapsKey}: ${flatEntities.length}`)
          .join(', ')})`,
      );
    }

    if (!dryRun) {
      await this.provisionInitialObjectViews(workspaceId);
    }
  }

  async down({
    workspaceId,
    options,
  }: RunOnWorkspaceArgs<ProvisionCatalogObjectsCommandOptions>): Promise<void> {
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

    const emptyMaps = Object.fromEntries(
      ACTIVITY_OBJECTS_FLAT_ENTITY_MAPS_KEYS.map((mapsKey) => [
        mapsKey,
        {
          byUniversalIdentifier: {},
          universalIdentifierById: {},
          universalIdentifiersByApplicationId: {},
        },
      ]),
    ) as unknown as ActivityObjectsFlatEntityMaps;

    // Against empty maps the deal page layout looks missing, so the Line of Item tab and widget
    // come back as dropped; that tab holds nothing else, so both are removed
    const {
      additions,
      droppedTabUniversalIdentifiers,
      droppedWidgetUniversalIdentifiers,
    } = selectCatalogObjectsStandardAdditions({
      existing: emptyMaps,
      standard,
    });

    const universalIdentifiersToRemove = new Set([
      ...Object.values(additions)
        .flat()
        .map((flatEntity) => flatEntity.universalIdentifier),
      ...droppedTabUniversalIdentifiers,
      ...droppedWidgetUniversalIdentifiers,
    ]);

    // Initial views, their view fields and anything users built on the catalog point at what is removed
    let hasChanged = true;

    while (hasChanged) {
      hasChanged = false;

      for (const mapsKey of ACTIVITY_OBJECTS_FLAT_ENTITY_MAPS_KEYS) {
        for (const flatEntity of Object.values(
          existing[mapsKey].byUniversalIdentifier,
        ).filter(isDefined)) {
          if (
            !universalIdentifiersToRemove.has(flatEntity.universalIdentifier) &&
            collectParentReferences(flatEntity).some((reference) =>
              universalIdentifiersToRemove.has(reference),
            )
          ) {
            universalIdentifiersToRemove.add(flatEntity.universalIdentifier);
            hasChanged = true;
          }
        }
      }
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
          idByUniversalIdentifierByMetadataName,
          fromToAllFlatEntityMaps: Object.fromEntries(
            ACTIVITY_OBJECTS_FLAT_ENTITY_MAPS_KEYS.map((mapsKey) => [
              mapsKey,
              {
                from: existing[mapsKey],
                to: removeFlatEntities(
                  existing[mapsKey] as FlatEntityMaps<SyncableFlatEntity>,
                  universalIdentifiersToRemove,
                ),
              },
            ]),
          ) as FromToAllUniversalFlatEntityMaps,
        },
      );

    if (result.status === 'fail') {
      throw new Error(
        `Catalog objects rollback failed for workspace ${workspaceId}: ${JSON.stringify(result)}`,
      );
    }

    this.logger.log(
      `${dryRun ? '[DRY RUN] ' : ''}Rolled back catalog objects for workspace ${workspaceId}`,
    );
  }

  private async assertNoCatalogObjectNameCollision({
    workspaceId,
    twentyStandardFlatApplication,
  }: {
    workspaceId: string;
    twentyStandardFlatApplication: FlatApplication;
  }): Promise<void> {
    const { flatObjectMetadataMaps } =
      await this.workspaceCacheService.getOrRecompute(workspaceId, [
        'flatObjectMetadataMaps',
      ]);

    const reservedNames = new Set(
      CATALOG_OBJECT_NAMES.flatMap((nameSingular) => [
        nameSingular,
        `${nameSingular}s`,
      ]),
    );

    const collidingObjects = Object.values(
      flatObjectMetadataMaps.byUniversalIdentifier,
    )
      .filter(isDefined)
      .filter(
        (flatObjectMetadata) =>
          flatObjectMetadata.applicationUniversalIdentifier !==
            twentyStandardFlatApplication.universalIdentifier &&
          (reservedNames.has(flatObjectMetadata.nameSingular) ||
            reservedNames.has(flatObjectMetadata.namePlural)),
      );

    if (collidingObjects.length > 0) {
      throw new Error(
        `Workspace ${workspaceId} still has custom object(s) ${collidingObjects
          .map(({ nameSingular }) => nameSingular)
          .join(
            ', ',
          )} that collide with the Product/Line Item standard objects. Export their records, delete them in Settings > Data model, then rerun the upgrade.`,
      );
    }
  }

  // Workspace creation gives each standard object an initial view owned by the custom application
  private async provisionInitialObjectViews(workspaceId: string) {
    const { flatObjectMetadataMaps, flatViewMaps, flatViewFieldMaps } =
      await this.workspaceCacheService.getOrRecompute(workspaceId, [
        'flatObjectMetadataMaps',
        'flatViewMaps',
        'flatViewFieldMaps',
      ]);

    const { workspaceCustomFlatApplication } =
      await this.applicationService.findWorkspaceTwentyStandardAndCustomApplicationOrThrow(
        { workspaceId },
      );

    const { viewsToCreate, viewFieldsToCreate } =
      computeMissingInitialObjectViewOperations({
        flatObjectMetadatas: CATALOG_OBJECT_UNIVERSAL_IDENTIFIERS.map(
          (universalIdentifier) =>
            flatObjectMetadataMaps.byUniversalIdentifier[universalIdentifier],
        ).filter(isDefined),
        flatViewMaps,
        flatViewFieldMaps,
        initialViewApplicationUniversalIdentifier:
          workspaceCustomFlatApplication.universalIdentifier,
      });

    if (viewsToCreate.length + viewFieldsToCreate.length === 0) {
      return;
    }

    const result =
      await this.workspaceMigrationValidateBuildAndRunService.validateBuildAndRunLegacyWorkspaceMigration(
        {
          isSystemBuild: true,
          workspaceId,
          applicationUniversalIdentifier:
            workspaceCustomFlatApplication.universalIdentifier,
          allFlatEntityOperationByMetadataName: {
            view: {
              flatEntityToCreate: viewsToCreate,
              flatEntityToDelete: [],
              flatEntityToUpdate: [],
            },
            viewField: {
              flatEntityToCreate: viewFieldsToCreate,
              flatEntityToDelete: [],
              flatEntityToUpdate: [],
            },
          },
        },
      );

    if (result.status === 'fail') {
      throw new Error(
        `Failed to seed catalog object initial views for workspace ${workspaceId}: ${JSON.stringify(result)}`,
      );
    }
  }
}
