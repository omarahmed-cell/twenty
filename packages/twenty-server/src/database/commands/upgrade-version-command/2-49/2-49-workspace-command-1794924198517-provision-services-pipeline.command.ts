import { Command, Option } from 'nest-commander';
import { SERVICE_PIPELINE_SEED } from 'twenty-shared/constants';
import {
  SERVICES_BOARD_VIEW_UNIVERSAL_IDENTIFIER,
  STANDARD_OBJECTS,
} from 'twenty-shared/metadata';
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
import { prefillServicePipelines } from 'src/engine/workspace-manager/standard-objects-prefill-data/utils/prefill-service-pipelines.util';
import { computeTwentyStandardApplicationAllFlatEntityMaps } from 'src/engine/workspace-manager/twenty-standard-application/utils/twenty-standard-application-all-flat-entity-maps.constant';
import { WorkspaceMigrationValidateBuildAndRunService } from 'src/engine/workspace-manager/workspace-migration/services/workspace-migration-validate-build-and-run-service';
import { DealStageCalculatedPropertiesService } from 'src/modules/pipeline/services/deal-stage-calculated-properties.service';
import { PipelineSyncService } from 'src/modules/pipeline/services/pipeline-sync.service';

type ProvisionServicesPipelineCommandOptions =
  ProvisionedWorkspaceCommandOptions & {
    rollback?: boolean;
  };

const SEEDED_FIELD_NAMES_BY_OBJECT = {
  service: ['pipeline', 'stage', 'stageHistory'],
  pipeline: ['stageCalculatedPropertyKinds'],
} as const satisfies Partial<
  Record<keyof typeof STANDARD_OBJECTS, readonly string[]>
>;

const SERVICES_PIPELINE_SEED_UNIVERSAL_IDENTIFIERS = [
  STANDARD_OBJECTS.serviceStageHistory.universalIdentifier,
  SERVICES_BOARD_VIEW_UNIVERSAL_IDENTIFIER,
  ...Object.entries(SEEDED_FIELD_NAMES_BY_OBJECT).flatMap(
    ([objectName, fieldNames]) =>
      fieldNames.map(
        (fieldName) =>
          (
            STANDARD_OBJECTS[objectName as keyof typeof STANDARD_OBJECTS]
              .fields as Record<string, { universalIdentifier: string }>
          )[fieldName].universalIdentifier,
      ),
  ),
];

const RESERVED_OBJECT_NAMES = new Set([
  'serviceStageHistory',
  'serviceStageHistories',
]);

@RegisteredWorkspaceCommand('2.49.0', 1794924198517)
@Command({
  name: 'upgrade:2-49:provision-services-pipeline',
  description:
    'Add the native service Pipeline and Stage fields, the hidden Service Stage Change object, the Services board and the pipeline Stage fields to generate setting, then seed the HubSpot Onboarding Pipeline with its stage date fields. Fails on a workspace that holds custom metadata with the same names. Pass --rollback to undo it.',
})
export class ProvisionServicesPipelineCommand extends ProvisionedWorkspaceCommandRunner<ProvisionServicesPipelineCommandOptions> {
  constructor(
    protected readonly workspaceIteratorService: WorkspaceIteratorService,
    private readonly applicationService: ApplicationService,
    private readonly workspaceCacheService: WorkspaceCacheService,
    private readonly workspaceMigrationValidateBuildAndRunService: WorkspaceMigrationValidateBuildAndRunService,
    private readonly pipelineSyncService: PipelineSyncService,
    private readonly dealStageCalculatedPropertiesService: DealStageCalculatedPropertiesService,
  ) {
    super(workspaceIteratorService);
  }

  @Option({
    flags: '--rollback',
    description: 'Undo what this command did',
    required: false,
  })
  parseRollback(): boolean {
    return true;
  }

  override async runOnWorkspace(
    args: RunOnWorkspaceArgs<ProvisionServicesPipelineCommandOptions>,
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
  }: RunOnWorkspaceArgs<ProvisionServicesPipelineCommandOptions>) {
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
      seedUniversalIdentifiers: SERVICES_PIPELINE_SEED_UNIVERSAL_IDENTIFIERS,
    });
    const additionCount = countSeededStandardAdditions(provision.additions);

    if (dryRun) {
      this.logger.log(
        `[DRY RUN] Workspace ${workspaceId}: ${additionCount} services pipeline standard addition(s)`,
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
          `Services pipeline provisioning failed for workspace ${workspaceId}: ${JSON.stringify(result)}`,
        );
      }
    }

    const seededPipelineCount = await prefillServicePipelines(
      dataSource.manager,
      getWorkspaceSchemaName(workspaceId),
    );

    await this.pipelineSyncService.syncSelectFields(workspaceId, 'service');
    await this.dealStageCalculatedPropertiesService.syncFields(
      workspaceId,
      'service',
    );

    this.logger.log(
      `Workspace ${workspaceId}: ${additionCount} services pipeline standard addition(s), ${seededPipelineCount} service pipeline(s) seeded`,
    );
  }

  async down({
    workspaceId,
    dataSource,
    options,
  }: RunOnWorkspaceArgs<ProvisionServicesPipelineCommandOptions>) {
    if ((options.dryRun ?? false) || !isDefined(dataSource)) {
      return;
    }

    const { twentyStandardFlatApplication } =
      await this.applicationService.findWorkspaceTwentyStandardAndCustomApplicationOrThrow(
        { workspaceId },
      );
    const schemaName = getWorkspaceSchemaName(workspaceId);
    const seededPipelineKeys = SERVICE_PIPELINE_SEED.map(({ key }) => key);

    await dataSource.query(
      `DELETE FROM "${schemaName}"."pipelineStage"
      WHERE "pipelineId" IN (
        SELECT "id" FROM "${schemaName}"."pipeline"
        WHERE "objectNameSingular" = 'service' AND "key" = ANY($1::text[])
      )`,
      [seededPipelineKeys],
    );
    await dataSource.query(
      `DELETE FROM "${schemaName}"."pipeline"
      WHERE "objectNameSingular" = 'service' AND "key" = ANY($1::text[])`,
      [seededPipelineKeys],
    );

    // Drops the stage date fields generated for the deleted stages
    await this.dealStageCalculatedPropertiesService.syncFields(
      workspaceId,
      'service',
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
            seedUniversalIdentifiers:
              SERVICES_PIPELINE_SEED_UNIVERSAL_IDENTIFIERS,
          }),
        },
      );

    if (result.status === 'fail') {
      throw new Error(
        `Services pipeline rollback failed for workspace ${workspaceId}: ${JSON.stringify(result)}`,
      );
    }

    this.logger.log(`Workspace ${workspaceId}: services pipeline rolled back`);
  }

  private assertNoNameCollision({
    workspaceId,
    existing,
    twentyStandardApplicationUniversalIdentifier,
  }: {
    workspaceId: string;
    existing: Pick<
      ActivityObjectsFlatEntityMaps,
      'flatObjectMetadataMaps' | 'flatFieldMetadataMaps'
    >;
    twentyStandardApplicationUniversalIdentifier: string;
  }) {
    const reservedFieldNamesByObjectUniversalIdentifier = new Map<
      string,
      readonly string[]
    >(
      Object.entries(SEEDED_FIELD_NAMES_BY_OBJECT).map(
        ([objectName, fieldNames]) => [
          STANDARD_OBJECTS[objectName as keyof typeof STANDARD_OBJECTS]
            .universalIdentifier,
          fieldNames,
        ],
      ),
    );

    const collisions = [
      ...Object.values(existing.flatObjectMetadataMaps.byUniversalIdentifier)
        .filter(isDefined)
        .filter(
          (flatObjectMetadata) =>
            flatObjectMetadata.applicationUniversalIdentifier !==
              twentyStandardApplicationUniversalIdentifier &&
            (RESERVED_OBJECT_NAMES.has(flatObjectMetadata.nameSingular) ||
              RESERVED_OBJECT_NAMES.has(flatObjectMetadata.namePlural)),
        )
        .map(({ nameSingular }) => nameSingular),
      ...Object.values(existing.flatFieldMetadataMaps.byUniversalIdentifier)
        .filter(isDefined)
        .filter(
          (flatFieldMetadata) =>
            flatFieldMetadata.applicationUniversalIdentifier !==
              twentyStandardApplicationUniversalIdentifier &&
            (
              reservedFieldNamesByObjectUniversalIdentifier.get(
                flatFieldMetadata.objectMetadataUniversalIdentifier,
              ) ?? []
            ).includes(flatFieldMetadata.name),
        )
        .map(({ name }) => name),
    ];

    if (collisions.length > 0) {
      throw new Error(
        `Workspace ${workspaceId} has custom metadata (${collisions.join(', ')}) that collides with the services pipeline metadata. Delete or rename it in Settings > Data model, then rerun the upgrade.`,
      );
    }
  }
}
