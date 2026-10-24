import { Command, Option } from 'nest-commander';
import { STANDARD_OBJECTS } from 'twenty-shared/metadata';
import { WidgetType } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import { type DataSource } from 'typeorm';

import {
  ProvisionedWorkspaceCommandRunner,
  type ProvisionedWorkspaceCommandOptions,
} from 'src/database/commands/command-runners/provisioned-workspace.command-runner';
import { WorkspaceIteratorService } from 'src/database/commands/command-runners/workspace-iterator.service';
import { type RunOnWorkspaceArgs } from 'src/database/commands/command-runners/workspace.command-runner';
import { readExistingColumnNamesByTableName } from 'src/database/commands/upgrade-version-command/2-38/utils/read-existing-column-names-by-table-name.util';
import { buildActivityObjectsLabelUpdates } from 'src/database/commands/upgrade-version-command/2-49/utils/build-activity-objects-label-updates.util';
import { buildCustomRecordPageActivityTabs } from 'src/database/commands/upgrade-version-command/2-49/utils/build-custom-record-page-activity-tabs.util';
import { findObjectsMissingActivityTargetRelation } from 'src/database/commands/upgrade-version-command/2-49/utils/find-objects-missing-activity-target-relation.util';
import {
  ACTIVITY_OBJECT_UNIVERSAL_IDENTIFIERS,
  ACTIVITY_OBJECTS_FLAT_ENTITY_MAPS_KEYS,
  collectParentReferences,
  type ActivityObjectsFlatEntities,
  type ActivityObjectsFlatEntityMaps,
  type ActivityObjectsFlatEntityMapsKey,
  selectActivityObjectsStandardAdditions,
} from 'src/database/commands/upgrade-version-command/2-49/utils/select-activity-objects-standard-additions.util';
import { ApplicationService } from 'src/engine/core-modules/application/application.service';
import { type FlatApplication } from 'src/engine/core-modules/application/types/flat-application.type';
import { RegisteredWorkspaceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-workspace-command.decorator';
import { type SyncableFlatEntity } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-from.type';
import { type FlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-maps.type';
import { findFlatEntityByUniversalIdentifier } from 'src/engine/metadata-modules/flat-entity/utils/find-flat-entity-by-universal-identifier.util';
import { type FlatObjectMetadata } from 'src/engine/metadata-modules/flat-object-metadata/types/flat-object-metadata.type';
import { computeMissingInitialObjectViewOperations } from 'src/engine/metadata-modules/view/utils/compute-missing-initial-object-view-operations.util';
import { buildSystemRelationFlatFieldMetadatasForObject } from 'src/engine/metadata-modules/object-metadata/utils/build-system-relation-flat-field-metadatas-for-object.util';
import { computeObjectTargetTable } from 'src/engine/utils/compute-object-target-table.util';
import { WorkspaceCacheService } from 'src/engine/workspace-cache/services/workspace-cache.service';
import { computeTwentyStandardApplicationAllFlatEntityMaps } from 'src/engine/workspace-manager/twenty-standard-application/utils/twenty-standard-application-all-flat-entity-maps.constant';
import { WorkspaceMigrationValidateBuildAndRunService } from 'src/engine/workspace-manager/workspace-migration/services/workspace-migration-validate-build-and-run-service';
import { type FromToAllUniversalFlatEntityMaps } from 'src/engine/workspace-manager/workspace-migration/types/workspace-migration-orchestrator.type';
import { getWorkspaceSchemaContextForMigration } from 'src/engine/workspace-manager/workspace-migration/workspace-migration-runner/utils/get-workspace-schema-context-for-migration.util';

type ProvisionActivityObjectsCommandOptions =
  ProvisionedWorkspaceCommandOptions & { rollback?: boolean };

const ACTIVITY_TARGETS = [
  {
    nameSingular: 'callTarget',
    universalIdentifier: STANDARD_OBJECTS.callTarget.universalIdentifier,
    morphId: STANDARD_OBJECTS.callTarget.morphIds.targetMorphId.morphId,
  },
  {
    nameSingular: 'communicationTarget',
    universalIdentifier:
      STANDARD_OBJECTS.communicationTarget.universalIdentifier,
    morphId:
      STANDARD_OBJECTS.communicationTarget.morphIds.targetMorphId.morphId,
  },
] as const;

const ACTIVITY_WIDGET_TYPES: string[] = [
  WidgetType.CALLS,
  WidgetType.COMMUNICATIONS,
];

const ACTIVITY_OBJECT_NAMES = [
  'service',
  'call',
  'callTarget',
  'communication',
  'communicationTarget',
];

const replaceFlatEntities = <T extends SyncableFlatEntity>(
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

const countFlatEntities = (flatEntitiesByMapsKey: Record<string, unknown[]>) =>
  Object.values(flatEntitiesByMapsKey).reduce(
    (total, flatEntities) => total + flatEntities.length,
    0,
  );

// The standard application is synchronized only at workspace creation, so a
// workspace created before this fork has none of its metadata. This adds it the
// way 2-43 provisioned agentChatThreadTarget: an additive from/to migration over
// the standard definitions, then the callTarget / communicationTarget relation
// pairs and record-page tabs that object creation now gives custom objects.
@RegisteredWorkspaceCommand('2.49.0', 1792864328886)
@Command({
  name: 'upgrade:2-49:provision-activity-objects',
  description:
    'Create the Service, Call and Communication standard objects (with their target junctions, views, record pages and navigation), the Company parent/child relation, the Service legs on existing target junctions, the Calls/Communications tabs and the Contacts/Deals/Meetings labels in existing workspaces, then give every custom object its Calls/Communications relation pairs and tabs. Fails on a workspace that still holds a custom service/call/communication object. Pass --rollback to remove what it added.',
})
export class ProvisionActivityObjectsCommand extends ProvisionedWorkspaceCommandRunner<ProvisionActivityObjectsCommandOptions> {
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
    args: RunOnWorkspaceArgs<ProvisionActivityObjectsCommandOptions>,
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
  }: RunOnWorkspaceArgs<ProvisionActivityObjectsCommandOptions>): Promise<void> {
    const dryRun = options.dryRun ?? false;

    const { twentyStandardFlatApplication } =
      await this.applicationService.findWorkspaceTwentyStandardAndCustomApplicationOrThrow(
        { workspaceId },
      );

    await this.assertNoActivityObjectNameCollision({
      workspaceId,
      twentyStandardFlatApplication,
    });

    const hasActivityObjects = await this.provisionStandardSchema({
      workspaceId,
      dryRun,
      twentyStandardFlatApplication,
    });

    if (!hasActivityObjects) {
      return;
    }

    await this.provisionInitialObjectViews({ workspaceId, dryRun });

    for (const activityTarget of ACTIVITY_TARGETS) {
      await this.provisionObjectRelations({
        workspaceId,
        dataSource,
        dryRun,
        activityTarget,
        twentyStandardApplicationUniversalIdentifier:
          twentyStandardFlatApplication.universalIdentifier,
      });
    }

    await this.provisionCustomRecordPageTabs({
      workspaceId,
      dryRun,
      twentyStandardApplicationUniversalIdentifier:
        twentyStandardFlatApplication.universalIdentifier,
    });
  }

  async down({
    workspaceId,
    options,
  }: RunOnWorkspaceArgs<ProvisionActivityObjectsCommandOptions>): Promise<void> {
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

    // Against empty maps every standard layout looks missing, so widgets added to
    // existing layouts come back as dropped; their tab goes only if nothing else is on it
    const {
      additions: allActivityObjectEntities,
      droppedTabUniversalIdentifiers,
      droppedWidgetUniversalIdentifiers,
    } = selectActivityObjectsStandardAdditions({
      existing: emptyMaps,
      standard,
    });

    const activityOnlyTabUniversalIdentifiers =
      droppedTabUniversalIdentifiers.filter((tabUniversalIdentifier) =>
        Object.values(standard.flatPageLayoutWidgetMaps.byUniversalIdentifier)
          .filter(isDefined)
          .filter(
            (widget) =>
              widget.pageLayoutTabUniversalIdentifier ===
              tabUniversalIdentifier,
          )
          .every((widget) =>
            droppedWidgetUniversalIdentifiers.includes(
              widget.universalIdentifier,
            ),
          ),
      );

    const universalIdentifiersToRemove = new Set([
      ...Object.values(allActivityObjectEntities)
        .flat()
        .map((flatEntity) => flatEntity.universalIdentifier),
      ...droppedWidgetUniversalIdentifiers,
      ...activityOnlyTabUniversalIdentifiers,
    ]);

    // Custom object tabs reference only their own layout, so they are matched by widget type
    for (const widget of Object.values(
      existing.flatPageLayoutWidgetMaps.byUniversalIdentifier,
    ).filter(isDefined)) {
      if (
        widget.applicationUniversalIdentifier !==
          twentyStandardFlatApplication.universalIdentifier &&
        ACTIVITY_WIDGET_TYPES.includes(widget.type)
      ) {
        universalIdentifiersToRemove.add(widget.universalIdentifier);
        universalIdentifiersToRemove.add(
          widget.pageLayoutTabUniversalIdentifier,
        );
      }
    }

    // Relation pairs, initial views and their view fields point at what is removed
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

    const labelRollbacks = buildActivityObjectsLabelUpdates({
      existing,
      standard,
      twentyStandardApplicationUniversalIdentifier:
        twentyStandardFlatApplication.universalIdentifier,
      direction: 'down',
    });

    const fromToAllFlatEntityMaps = Object.fromEntries(
      ACTIVITY_OBJECTS_FLAT_ENTITY_MAPS_KEYS.map((mapsKey) => {
        const labelRollbacksForMapsKey = (
          (labelRollbacks as Partial<ActivityObjectsFlatEntities>)[mapsKey] ??
          []
        ).filter(
          (flatEntity) =>
            !universalIdentifiersToRemove.has(flatEntity.universalIdentifier),
        );

        return [
          mapsKey,
          {
            from: existing[mapsKey],
            to: replaceFlatEntities(
              removeFlatEntities(
                existing[mapsKey] as FlatEntityMaps<SyncableFlatEntity>,
                universalIdentifiersToRemove,
              ),
              labelRollbacksForMapsKey as SyncableFlatEntity[],
            ),
          },
        ];
      }),
    ) as FromToAllUniversalFlatEntityMaps;

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
          fromToAllFlatEntityMaps,
        },
      );

    if (result.status === 'fail') {
      throw new Error(
        `Activity objects rollback failed for workspace ${workspaceId}: ${JSON.stringify(result)}`,
      );
    }

    this.logger.log(
      `${dryRun ? '[DRY RUN] ' : ''}Rolled back activity objects for workspace ${workspaceId}`,
    );
  }

  // A leftover custom object with a reused name would collide with the standard one
  private async assertNoActivityObjectNameCollision({
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
      ACTIVITY_OBJECT_NAMES.flatMap((nameSingular) => [
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
          )} that collide with the Service/Call/Communication standard objects. Export their records, delete them in Settings > Data model, then rerun the upgrade.`,
      );
    }
  }

  // Returns whether the activity objects exist afterwards; a dry run never creates them
  private async provisionStandardSchema({
    workspaceId,
    dryRun,
    twentyStandardFlatApplication,
  }: {
    workspaceId: string;
    dryRun: boolean;
    twentyStandardFlatApplication: FlatApplication;
  }): Promise<boolean> {
    // The migration builder mutates its optimistic maps, even on dry runs
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
      selectActivityObjectsStandardAdditions({ existing, standard });

    if (droppedTabUniversalIdentifiers.length > 0) {
      this.logger.warn(
        `Workspace ${workspaceId}: skipped ${droppedTabUniversalIdentifiers.length} tab(s) whose record page layout is missing: ${droppedTabUniversalIdentifiers.join(', ')}`,
      );
    }

    const labelUpdates = buildActivityObjectsLabelUpdates({
      existing,
      standard,
      twentyStandardApplicationUniversalIdentifier:
        twentyStandardFlatApplication.universalIdentifier,
      direction: 'up',
    });

    const additionCount = countFlatEntities(additions);
    const labelUpdateCount = countFlatEntities(labelUpdates);

    if (additionCount + labelUpdateCount === 0) {
      return true;
    }

    const fromToAllFlatEntityMaps = Object.fromEntries(
      ACTIVITY_OBJECTS_FLAT_ENTITY_MAPS_KEYS.map(
        (mapsKey: ActivityObjectsFlatEntityMapsKey) => {
          const labelUpdatesForMapsKey =
            (labelUpdates as Partial<ActivityObjectsFlatEntities>)[mapsKey] ??
            [];

          return [
            mapsKey,
            {
              from: existing[mapsKey],
              to: replaceFlatEntities(
                existing[mapsKey] as FlatEntityMaps<SyncableFlatEntity>,
                [
                  ...additions[mapsKey],
                  ...labelUpdatesForMapsKey,
                ] as SyncableFlatEntity[],
              ),
            },
          ];
        },
      ),
    ) as FromToAllUniversalFlatEntityMaps;

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
          fromToAllFlatEntityMaps,
        },
      );

    if (result.status === 'fail') {
      throw new Error(
        `Activity objects provisioning failed for workspace ${workspaceId}: ${JSON.stringify(result)}`,
      );
    }

    const summary = Object.entries(additions)
      .filter(([, flatEntities]) => flatEntities.length > 0)
      .map(([mapsKey, flatEntities]) => `${mapsKey}: ${flatEntities.length}`)
      .join(', ');

    this.logger.log(
      `${dryRun ? '[DRY RUN] ' : ''}Workspace ${workspaceId}: ${additionCount} standard addition(s) (${summary}) and ${labelUpdateCount} label update(s)`,
    );

    return !dryRun;
  }

  // Workspace creation gives each standard object an initial view owned by the custom application
  private async provisionInitialObjectViews({
    workspaceId,
    dryRun,
  }: {
    workspaceId: string;
    dryRun: boolean;
  }): Promise<void> {
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
        flatObjectMetadatas: ACTIVITY_OBJECT_UNIVERSAL_IDENTIFIERS.map(
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

    this.logger.log(
      `${dryRun ? '[DRY RUN] ' : ''}Seeding ${viewsToCreate.length} initial view(s) for workspace ${workspaceId}`,
    );

    if (dryRun) {
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
        `Failed to seed activity object initial views for workspace ${workspaceId}: ${JSON.stringify(result)}`,
      );
    }
  }

  private async provisionObjectRelations({
    workspaceId,
    dataSource,
    dryRun,
    activityTarget,
    twentyStandardApplicationUniversalIdentifier,
  }: {
    workspaceId: string;
    dataSource: DataSource | undefined;
    dryRun: boolean;
    activityTarget: (typeof ACTIVITY_TARGETS)[number];
    twentyStandardApplicationUniversalIdentifier: string;
  }): Promise<void> {
    const { flatObjectMetadataMaps, flatFieldMetadataMaps, flatIndexMaps } =
      await this.workspaceCacheService.getOrRecompute(workspaceId, [
        'flatObjectMetadataMaps',
        'flatFieldMetadataMaps',
        'flatIndexMaps',
      ]);

    const targetFlatObjectMetadata =
      findFlatEntityByUniversalIdentifier<FlatObjectMetadata>({
        flatEntityMaps: flatObjectMetadataMaps,
        universalIdentifier: activityTarget.universalIdentifier,
      });

    if (!isDefined(targetFlatObjectMetadata)) {
      throw new Error(
        `${activityTarget.nameSingular} is missing from workspace ${workspaceId} after provisioning`,
      );
    }

    if (!isDefined(dataSource)) {
      this.logger.error(
        `Cannot verify ${activityTarget.nameSingular} columns for workspace ${workspaceId}: no data source. Skipping its object relations, rerun once the workspace is reachable.`,
      );

      return;
    }

    const { tableName } = getWorkspaceSchemaContextForMigration({
      workspaceId,
      objectMetadata: targetFlatObjectMetadata,
    });

    const columnNamesByTableName = await readExistingColumnNamesByTableName({
      dataSource,
      schemaName: getWorkspaceSchemaContextForMigration({
        workspaceId,
        objectMetadata: targetFlatObjectMetadata,
      }).schemaName,
      tableNames: Object.values(flatObjectMetadataMaps.byUniversalIdentifier)
        .filter(isDefined)
        .map((flatObjectMetadata) =>
          computeObjectTargetTable(flatObjectMetadata),
        ),
    });

    const { flatObjectMetadatas, unprovisionableRelations } =
      findObjectsMissingActivityTargetRelation({
        flatObjectMetadataMaps,
        flatFieldMetadataMaps,
        targetFlatObjectMetadata,
        targetMorphId: activityTarget.morphId,
        existingTargetColumnNames:
          columnNamesByTableName.get(tableName) ?? new Set(),
        existingTableNames: new Set(columnNamesByTableName.keys()),
        twentyStandardApplicationUniversalIdentifier,
      });

    if (unprovisionableRelations.length > 0) {
      this.logger.error(
        [
          `MANUAL REPAIR REQUIRED: ${unprovisionableRelations.length} ${activityTarget.nameSingular} relation(s) in workspace ${workspaceId} cannot be provisioned automatically:`,
          ...unprovisionableRelations.map(
            ({ objectNameSingular, reason }) =>
              `  - ${objectNameSingular} <-> ${activityTarget.nameSingular}: ${reason}`,
          ),
        ].join('\n'),
      );
    }

    if (flatObjectMetadatas.length === 0) {
      return;
    }

    this.logger.log(
      `${dryRun ? '[DRY RUN] ' : ''}Provisioning the ${activityTarget.nameSingular} relation of ${flatObjectMetadatas.length} object(s) for workspace ${workspaceId}: ${flatObjectMetadatas
        .map(({ nameSingular }) => nameSingular)
        .join(', ')}`,
    );

    if (dryRun) {
      return;
    }

    const flatObjectMetadatasByApplicationUniversalIdentifier = new Map<
      string,
      FlatObjectMetadata[]
    >();

    for (const flatObjectMetadata of flatObjectMetadatas) {
      const { applicationUniversalIdentifier } = flatObjectMetadata;

      flatObjectMetadatasByApplicationUniversalIdentifier.set(
        applicationUniversalIdentifier,
        [
          ...(flatObjectMetadatasByApplicationUniversalIdentifier.get(
            applicationUniversalIdentifier,
          ) ?? []),
          flatObjectMetadata,
        ],
      );
    }

    for (const [
      applicationUniversalIdentifier,
      applicationFlatObjectMetadatas,
    ] of flatObjectMetadatasByApplicationUniversalIdentifier) {
      const bundles = applicationFlatObjectMetadatas.flatMap(
        (sourceFlatObjectMetadata) =>
          buildSystemRelationFlatFieldMetadatasForObject({
            sourceFlatObjectMetadata,
            standardTargetFlatObjectMetadataByNameSingular: {
              [activityTarget.nameSingular]: targetFlatObjectMetadata,
            },
            applicationUniversalIdentifier,
          }),
      );

      // Exactly what objectSystemRelationsOnCreate emits, so it is applied literally
      const result =
        await this.workspaceMigrationValidateBuildAndRunService.validateBuildAndRunLegacyWorkspaceMigration(
          {
            isSystemBuild: true,
            workspaceId,
            applicationUniversalIdentifier,
            allFlatEntityOperationByMetadataName: {
              fieldMetadata: {
                flatEntityToCreate: bundles.flatMap(
                  ({ forwardFlatFieldMetadata, reverseFlatFieldMetadata }) => [
                    forwardFlatFieldMetadata,
                    reverseFlatFieldMetadata,
                  ],
                ),
                flatEntityToDelete: [],
                flatEntityToUpdate: [],
              },
              index: {
                flatEntityToCreate: bundles
                  .map(({ flatIndexMetadata }) => flatIndexMetadata)
                  .filter(
                    (flatIndexMetadata) =>
                      !isDefined(
                        flatIndexMaps.byUniversalIdentifier[
                          flatIndexMetadata.universalIdentifier
                        ],
                      ),
                  ),
                flatEntityToDelete: [],
                flatEntityToUpdate: [],
              },
            },
          },
        );

      if (result.status === 'fail') {
        throw new Error(
          `Failed to provision ${activityTarget.nameSingular} relations for application ${applicationUniversalIdentifier} in workspace ${workspaceId}:\n${JSON.stringify(result, null, 2)}`,
        );
      }
    }

    this.logger.log(
      `Provisioned the ${activityTarget.nameSingular} relation of ${flatObjectMetadatas.length} object(s) for workspace ${workspaceId}`,
    );
  }

  private async provisionCustomRecordPageTabs({
    workspaceId,
    dryRun,
    twentyStandardApplicationUniversalIdentifier,
  }: {
    workspaceId: string;
    dryRun: boolean;
    twentyStandardApplicationUniversalIdentifier: string;
  }): Promise<void> {
    const {
      flatObjectMetadataMaps,
      flatPageLayoutMaps,
      flatPageLayoutTabMaps,
      flatPageLayoutWidgetMaps,
    } = await this.workspaceCacheService.getOrRecompute(workspaceId, [
      'flatObjectMetadataMaps',
      'flatPageLayoutMaps',
      'flatPageLayoutTabMaps',
      'flatPageLayoutWidgetMaps',
    ]);

    const tabsByApplicationUniversalIdentifier =
      buildCustomRecordPageActivityTabs({
        flatObjectMetadataMaps,
        flatPageLayoutMaps,
        flatPageLayoutTabMaps,
        flatPageLayoutWidgetMaps,
        twentyStandardApplicationUniversalIdentifier,
        now: new Date().toISOString(),
      });

    for (const [
      applicationUniversalIdentifier,
      { pageLayoutTabs, pageLayoutWidgets },
    ] of tabsByApplicationUniversalIdentifier) {
      this.logger.log(
        `${dryRun ? '[DRY RUN] ' : ''}Adding ${pageLayoutTabs.length} Calls/Communications tab(s) to custom record pages of application ${applicationUniversalIdentifier} in workspace ${workspaceId}`,
      );

      if (dryRun) {
        continue;
      }

      const result =
        await this.workspaceMigrationValidateBuildAndRunService.validateBuildAndRunLegacyWorkspaceMigration(
          {
            isSystemBuild: true,
            workspaceId,
            applicationUniversalIdentifier,
            allFlatEntityOperationByMetadataName: {
              pageLayoutTab: {
                flatEntityToCreate: pageLayoutTabs,
                flatEntityToDelete: [],
                flatEntityToUpdate: [],
              },
              pageLayoutWidget: {
                flatEntityToCreate: pageLayoutWidgets,
                flatEntityToDelete: [],
                flatEntityToUpdate: [],
              },
            },
          },
        );

      if (result.status === 'fail') {
        throw new Error(
          `Failed to add Calls/Communications tabs for application ${applicationUniversalIdentifier} in workspace ${workspaceId}:\n${JSON.stringify(result, null, 2)}`,
        );
      }
    }
  }
}
