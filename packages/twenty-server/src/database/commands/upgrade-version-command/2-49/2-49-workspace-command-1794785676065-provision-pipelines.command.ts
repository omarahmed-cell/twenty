import { Command, Option } from 'nest-commander';
import {
  LEGACY_DEAL_STAGE_TO_PIPELINE_STAGE_VALUE,
  PIPELINE_SEED,
} from 'twenty-shared/constants';
import {
  DEALS_BOARD_VIEW_UNIVERSAL_IDENTIFIER,
  STANDARD_OBJECTS,
} from 'twenty-shared/metadata';
import { getSelectOptionUniversalIdentifier } from 'twenty-shared/application';
import { buildPipelineSelectOptions, isDefined } from 'twenty-shared/utils';

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
import { FieldMetadataService } from 'src/engine/metadata-modules/field-metadata/services/field-metadata.service';
import { findFlatEntityByUniversalIdentifier } from 'src/engine/metadata-modules/flat-entity/utils/find-flat-entity-by-universal-identifier.util';
import { type FlatFieldMetadata } from 'src/engine/metadata-modules/flat-field-metadata/types/flat-field-metadata.type';
import { WorkspaceCacheService } from 'src/engine/workspace-cache/services/workspace-cache.service';
import { getWorkspaceSchemaName } from 'src/engine/workspace-datasource/utils/get-workspace-schema-name.util';
import { prefillPipelines } from 'src/engine/workspace-manager/standard-objects-prefill-data/utils/prefill-pipelines.util';
import { computeTwentyStandardApplicationAllFlatEntityMaps } from 'src/engine/workspace-manager/twenty-standard-application/utils/twenty-standard-application-all-flat-entity-maps.constant';
import { WorkspaceMigrationValidateBuildAndRunService } from 'src/engine/workspace-manager/workspace-migration/services/workspace-migration-validate-build-and-run-service';
import { PipelineSyncService } from 'src/modules/pipeline/services/pipeline-sync.service';

type ProvisionPipelinesCommandOptions = ProvisionedWorkspaceCommandOptions & {
  rollback?: boolean;
};

type SelectOption = {
  id: string;
  value: string;
  label: string;
  position: number;
  color: string;
};

const OPPORTUNITY_FIELDS = STANDARD_OBJECTS.opportunity.fields;

const NEW_OPPORTUNITY_FIELD_NAMES = [
  'pipeline',
  'dealProbability',
  'weightedAmount',
  'isClosed',
  'isClosedWon',
  'isClosedLost',
  'isOpen',
  'actualDuration',
] as const;

const PIPELINE_SEED_UNIVERSAL_IDENTIFIERS = [
  STANDARD_OBJECTS.pipeline.universalIdentifier,
  STANDARD_OBJECTS.pipelineStage.universalIdentifier,
  ...NEW_OPPORTUNITY_FIELD_NAMES.map(
    (fieldName) => OPPORTUNITY_FIELDS[fieldName].universalIdentifier,
  ),
];

const RESERVED_OBJECT_NAMES = new Set([
  'pipeline',
  'pipelines',
  'pipelineStage',
  'pipelineStages',
]);

const LEGACY_STAGE_LABELS: Record<string, string> = {
  NEW: 'New',
  SCREENING: 'Screening',
  MEETING: 'Meeting',
  PROPOSAL: 'Proposal',
  CUSTOMER: 'Customer',
  CLOSED_LOST: 'Closed Lost',
};

@RegisteredWorkspaceCommand('2.49.0', 1794785676065)
@Command({
  name: 'upgrade:2-49:provision-pipelines',
  description:
    'Add the Pipelines configuration (hidden Pipeline and Pipeline Stage objects seeded with the 4 HubSpot deal pipelines), the native Pipeline field and the server-written deal probability fields, move existing deals from the old default stages to the Sales Pipeline, rename Stage to Deal Stage and By Stage to Deals board. Pass --rollback to undo it.',
})
export class ProvisionPipelinesCommand extends ProvisionedWorkspaceCommandRunner<ProvisionPipelinesCommandOptions> {
  constructor(
    protected readonly workspaceIteratorService: WorkspaceIteratorService,
    private readonly applicationService: ApplicationService,
    private readonly workspaceCacheService: WorkspaceCacheService,
    private readonly workspaceMigrationValidateBuildAndRunService: WorkspaceMigrationValidateBuildAndRunService,
    private readonly fieldMetadataService: FieldMetadataService,
    private readonly pipelineSyncService: PipelineSyncService,
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
    args: RunOnWorkspaceArgs<ProvisionPipelinesCommandOptions>,
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
  }: RunOnWorkspaceArgs<ProvisionPipelinesCommandOptions>) {
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
      seedUniversalIdentifiers: PIPELINE_SEED_UNIVERSAL_IDENTIFIERS,
    });
    const additionCount = countSeededStandardAdditions(provision.additions);

    if (dryRun) {
      this.logger.log(
        `[DRY RUN] Workspace ${workspaceId}: ${additionCount} pipeline standard addition(s)`,
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
          `Pipelines provisioning failed for workspace ${workspaceId}: ${JSON.stringify(result)}`,
        );
      }
    }

    const schemaName = getWorkspaceSchemaName(workspaceId);
    const seededPipelineCount = await prefillPipelines(
      dataSource.manager,
      schemaName,
    );

    const stageField = await this.getStageField(workspaceId);
    const legacyOptions = ((stageField.options ?? []) as SelectOption[]).filter(
      (option) => isDefined(LEGACY_DEAL_STAGE_TO_PIPELINE_STAGE_VALUE[option.value]),
    );

    // Holds old and new stages together while the deals move over
    const seeded = this.buildSeedSelectOptions(
      (stageField.options ?? []) as SelectOption[],
    );

    await this.fieldMetadataService.updateOneField({
      workspaceId,
      isSystemBuild: true,
      ownerFlatApplication: twentyStandardFlatApplication,
      updateFieldInput: {
        id: stageField.id,
        label: 'Deal Stage',
        defaultValue: `'${seeded.defaultStageValue}'`,
        options: [
          ...seeded.stageOptions,
          ...legacyOptions.map((option, index) => ({
            ...option,
            position: seeded.stageOptions.length + index,
          })),
        ],
      },
    });

    const remapCounts: Record<string, number> = {};

    for (const [legacyValue, stageValue] of Object.entries(
      LEGACY_DEAL_STAGE_TO_PIPELINE_STAGE_VALUE,
    )) {
      const [, count]: [unknown, number] = await dataSource.query(
        `UPDATE "${schemaName}"."opportunity"
        SET "stage" = $1, "pipeline" = 'SALES_PIPELINE'
        WHERE "stage"::text = $2`,
        [stageValue, legacyValue],
      );

      remapCounts[legacyValue] = count;
    }

    const configuredStageValues = PIPELINE_SEED.flatMap(({ stages }) =>
      stages.map(({ value }) => value),
    );
    const [{ count: strandedCount }]: { count: string }[] =
      await dataSource.query(
        `SELECT count(*) FROM "${schemaName}"."opportunity"
        WHERE NOT ("stage"::text = ANY($1::text[]))`,
        [configuredStageValues],
      );

    if (Number(strandedCount) > 0) {
      throw new Error(
        `Workspace ${workspaceId}: ${strandedCount} deal(s) are in a stage that no pipeline holds; map them before rerunning the upgrade`,
      );
    }

    await this.pipelineSyncService.syncOpportunitySelectFields(workspaceId);

    await dataSource.query(
      `UPDATE "core"."view" SET "name" = 'Deals board'
      WHERE "workspaceId" = $1 AND "universalIdentifier" = $2 AND "name" = 'By Stage'`,
      [workspaceId, DEALS_BOARD_VIEW_UNIVERSAL_IDENTIFIER],
    );
    await this.workspaceCacheService.invalidateAndRecompute(workspaceId, [
      'flatViewMaps',
    ]);

    this.logger.log(
      `Workspace ${workspaceId}: ${additionCount} pipeline standard addition(s), ${seededPipelineCount} pipeline(s) seeded, deals moved ${JSON.stringify(remapCounts)}`,
    );
  }

  async down({
    workspaceId,
    dataSource,
    options,
  }: RunOnWorkspaceArgs<ProvisionPipelinesCommandOptions>) {
    if ((options.dryRun ?? false) || !isDefined(dataSource)) {
      return;
    }

    const { twentyStandardFlatApplication } =
      await this.applicationService.findWorkspaceTwentyStandardAndCustomApplicationOrThrow(
        { workspaceId },
      );
    const schemaName = getWorkspaceSchemaName(workspaceId);
    const stageField = await this.getStageField(workspaceId);
    const legacyOptions = Object.entries(LEGACY_STAGE_LABELS).map(
      ([value, label], position) => ({
        id:
          ((stageField.options ?? []) as SelectOption[]).find(
            (option) => option.value === value,
          )?.id ??
          getSelectOptionUniversalIdentifier({
            applicationUniversalIdentifier:
              twentyStandardFlatApplication.universalIdentifier,
            fieldUniversalIdentifier:
              OPPORTUNITY_FIELDS.stage.universalIdentifier,
            value,
          }),
        value,
        label,
        position,
        color: 'gray',
      }),
    );
    const currentOptions = (stageField.options ?? []) as SelectOption[];

    await this.fieldMetadataService.updateOneField({
      workspaceId,
      isSystemBuild: true,
      ownerFlatApplication: twentyStandardFlatApplication,
      updateFieldInput: {
        id: stageField.id,
        options: [
          ...currentOptions.filter(
            (option) => !isDefined(LEGACY_STAGE_LABELS[option.value]),
          ),
          ...legacyOptions.map((option, index) => ({
            ...option,
            position: currentOptions.length + index,
          })),
        ],
      },
    });

    for (const [legacyValue, stageValue] of Object.entries(
      LEGACY_DEAL_STAGE_TO_PIPELINE_STAGE_VALUE,
    )) {
      await dataSource.query(
        `UPDATE "${schemaName}"."opportunity" SET "stage" = $1 WHERE "stage"::text = $2`,
        [legacyValue, stageValue],
      );
    }

    // Deals in stages the old list never had go back to the first old stage
    await dataSource.query(
      `UPDATE "${schemaName}"."opportunity" SET "stage" = 'NEW'
      WHERE NOT ("stage"::text = ANY($1::text[]))`,
      [Object.keys(LEGACY_STAGE_LABELS)],
    );

    await this.fieldMetadataService.updateOneField({
      workspaceId,
      isSystemBuild: true,
      ownerFlatApplication: twentyStandardFlatApplication,
      updateFieldInput: {
        id: stageField.id,
        label: 'Stage',
        defaultValue: `'NEW'`,
        options: legacyOptions,
      },
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
            seedUniversalIdentifiers: PIPELINE_SEED_UNIVERSAL_IDENTIFIERS,
          }),
        },
      );

    if (result.status === 'fail') {
      throw new Error(
        `Pipelines rollback failed for workspace ${workspaceId}: ${JSON.stringify(result)}`,
      );
    }

    await dataSource.query(
      `UPDATE "core"."view" SET "name" = 'By Stage'
      WHERE "workspaceId" = $1 AND "universalIdentifier" = $2 AND "name" = 'Deals board'`,
      [workspaceId, DEALS_BOARD_VIEW_UNIVERSAL_IDENTIFIER],
    );
    await this.workspaceCacheService.invalidateAndRecompute(workspaceId, [
      'flatViewMaps',
    ]);

    this.logger.log(`Workspace ${workspaceId}: pipelines rolled back`);
  }

  private buildSeedSelectOptions(existingStageOptions: SelectOption[]) {
    return buildPipelineSelectOptions({
      pipelines: PIPELINE_SEED.map((pipeline) => ({
        key: pipeline.key,
        name: pipeline.name,
        stages: pipeline.stages.map(({ value, label }) => ({
          value,
          label,
          color: null,
        })),
      })),
      pipelineFieldUniversalIdentifier:
        OPPORTUNITY_FIELDS.pipeline.universalIdentifier,
      stageFieldUniversalIdentifier: OPPORTUNITY_FIELDS.stage.universalIdentifier,
      existingStageOptions,
    });
  }

  private async getStageField(workspaceId: string) {
    const { flatFieldMetadataMaps } =
      await this.workspaceCacheService.getOrRecompute(workspaceId, [
        'flatFieldMetadataMaps',
      ]);

    const stageField = findFlatEntityByUniversalIdentifier<FlatFieldMetadata>({
      flatEntityMaps: flatFieldMetadataMaps,
      universalIdentifier: OPPORTUNITY_FIELDS.stage.universalIdentifier,
    });

    if (!isDefined(stageField)) {
      throw new Error(`Workspace ${workspaceId}: deal stage field not found`);
    }

    return stageField;
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
    const reservedFieldNames: readonly string[] = NEW_OPPORTUNITY_FIELD_NAMES;

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
            flatFieldMetadata.objectMetadataUniversalIdentifier ===
              STANDARD_OBJECTS.opportunity.universalIdentifier &&
            reservedFieldNames.includes(flatFieldMetadata.name),
        )
        .map(({ name }) => name),
    ];

    if (collisions.length > 0) {
      throw new Error(
        `Workspace ${workspaceId} has custom metadata (${collisions.join(', ')}) that collides with the native pipeline metadata. Delete or rename it in Settings > Data model, then rerun the upgrade.`,
      );
    }
  }
}
