import { Command, Option } from 'nest-commander';
import { STANDARD_OBJECTS } from 'twenty-shared/metadata';
import { FieldMetadataType } from 'twenty-shared/types';
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
import { buildCompanyParentChildLabelUpdates } from 'src/database/commands/upgrade-version-command/2-49/utils/build-company-parent-child-label-updates.util';
import { ACTIVITY_OBJECTS_FLAT_ENTITY_MAPS_KEYS } from 'src/database/commands/upgrade-version-command/2-49/utils/select-activity-objects-standard-additions.util';
import { ApplicationService } from 'src/engine/core-modules/application/application.service';
import { RegisteredWorkspaceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-workspace-command.decorator';
import { type FlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-maps.type';
import { type FlatFieldMetadata } from 'src/engine/metadata-modules/flat-field-metadata/types/flat-field-metadata.type';
import { WorkspaceCacheService } from 'src/engine/workspace-cache/services/workspace-cache.service';
import { computeTwentyStandardApplicationAllFlatEntityMaps } from 'src/engine/workspace-manager/twenty-standard-application/utils/twenty-standard-application-all-flat-entity-maps.constant';
import { type FromToAllUniversalFlatEntityMaps } from 'src/engine/workspace-manager/workspace-migration/types/workspace-migration-orchestrator.type';
import { WorkspaceMigrationValidateBuildAndRunService } from 'src/engine/workspace-manager/workspace-migration/services/workspace-migration-validate-build-and-run-service';

type ProvisionCompanyCalculatedFieldsCommandOptions =
  ProvisionedWorkspaceCommandOptions & {
    rollback?: boolean;
  };

const COMPANY_FIELDS = STANDARD_OBJECTS.company.fields;

const LIFECYCLE_STAGE_UNIVERSAL_IDENTIFIER =
  COMPANY_FIELDS.lifecycleStage.universalIdentifier;

const COMPANY_CALCULATED_FIELD_SEED_UNIVERSAL_IDENTIFIERS = [
  COMPANY_FIELDS.isParentCompany,
  COMPANY_FIELDS.isChildCompany,
  COMPANY_FIELDS.numberOfChildCompanies,
  COMPANY_FIELDS.numberOfAssociatedContacts,
  COMPANY_FIELDS.numberOfAssociatedDeals,
  COMPANY_FIELDS.numberOfOpenDeals,
  COMPANY_FIELDS.lastActivityDate,
  COMPANY_FIELDS.dateEnteredCurrentStage,
  ...Object.entries(COMPANY_FIELDS)
    .filter(([fieldName]) => /^date(Entered|Exited).+LifecycleStage$/.test(fieldName))
    .map(([, field]) => field),
].map(({ universalIdentifier }) => universalIdentifier);

const LIFECYCLE_STAGE_OPTION_VALUES = [
  'NEW',
  'LEAD',
  'MARKETING_QUALIFIED_LEAD',
  'SALES_QUALIFIED_LEAD',
  'OPPORTUNITY',
  'CUSTOMER',
  'PROMOTER',
  'OTHER',
  'CLOSING',
  'ON_HOLD',
  'BIN',
];

@RegisteredWorkspaceCommand('2.49.0', 1794600000000)
@Command({
  name: 'upgrade:2-49:provision-company-calculated-fields',
  description:
    'Make an existing custom company lifecycleStage field native in place (same field, column, options and data), add the server-computed company fields and lifecycle stage dates, and relabel Parent company / Child companies. Pass --rollback to remove what it added and hand lifecycleStage back to the custom application.',
})
export class ProvisionCompanyCalculatedFieldsCommand extends ProvisionedWorkspaceCommandRunner<ProvisionCompanyCalculatedFieldsCommandOptions> {
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
    args: RunOnWorkspaceArgs<ProvisionCompanyCalculatedFieldsCommandOptions>,
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
  }: RunOnWorkspaceArgs<ProvisionCompanyCalculatedFieldsCommandOptions>) {
    const dryRun = options.dryRun ?? false;

    const { twentyStandardFlatApplication } =
      await this.applicationService.findWorkspaceTwentyStandardAndCustomApplicationOrThrow(
        { workspaceId },
      );

    if (isDefined(dataSource)) {
      await this.promoteCustomLifecycleStageField({
        workspaceId,
        dataSource,
        twentyStandardApplicationId: twentyStandardFlatApplication.id,
        dryRun,
      });
    }

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

    const provision = buildSeededStandardAdditionsFromTo({
      existing,
      standard,
      // A promoted lifecycleStage keeps its own view fields, so only a missing one is seeded
      seedUniversalIdentifiers: isDefined(
        existing.flatFieldMetadataMaps.byUniversalIdentifier[
          LIFECYCLE_STAGE_UNIVERSAL_IDENTIFIER
        ],
      )
        ? COMPANY_CALCULATED_FIELD_SEED_UNIVERSAL_IDENTIFIERS
        : [
            ...COMPANY_CALCULATED_FIELD_SEED_UNIVERSAL_IDENTIFIERS,
            LIFECYCLE_STAGE_UNIVERSAL_IDENTIFIER,
          ],
    });

    const labelUpdates = buildCompanyParentChildLabelUpdates({
      existingFlatFieldMetadataMaps: existing.flatFieldMetadataMaps,
      standardFlatFieldMetadataMaps: standard.flatFieldMetadataMaps,
      direction: 'up',
    });

    const additionCount = countSeededStandardAdditions(provision.additions);

    if (additionCount + labelUpdates.length === 0) {
      return;
    }

    const fromToAllFlatEntityMaps = withFieldMetadataUpdates({
      fromToAllFlatEntityMaps: provision.fromToAllFlatEntityMaps,
      existingFlatFieldMetadataMaps: existing.flatFieldMetadataMaps,
      flatFieldMetadatas: labelUpdates,
    });

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
        `Company calculated fields provisioning failed for workspace ${workspaceId}: ${JSON.stringify(result)}`,
      );
    }

    this.logger.log(
      `${dryRun ? '[DRY RUN] ' : ''}Workspace ${workspaceId}: ${additionCount} company standard addition(s) and ${labelUpdates.length} label update(s)`,
    );
  }

  async down({
    workspaceId,
    dataSource,
    options,
  }: RunOnWorkspaceArgs<ProvisionCompanyCalculatedFieldsCommandOptions>) {
    const dryRun = options.dryRun ?? false;

    const { twentyStandardFlatApplication, workspaceCustomFlatApplication } =
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

    // lifecycleStage holds data, so the rollback hands it back instead of deleting it
    const rollback = buildSeededStandardRollbackFromTo({
      existing,
      standard,
      seedUniversalIdentifiers:
        COMPANY_CALCULATED_FIELD_SEED_UNIVERSAL_IDENTIFIERS,
    });

    const labelUpdates = buildCompanyParentChildLabelUpdates({
      existingFlatFieldMetadataMaps: existing.flatFieldMetadataMaps,
      standardFlatFieldMetadataMaps: standard.flatFieldMetadataMaps,
      direction: 'down',
    });

    const fromToAllFlatEntityMaps = withFieldMetadataUpdates({
      fromToAllFlatEntityMaps: rollback,
      existingFlatFieldMetadataMaps: existing.flatFieldMetadataMaps,
      flatFieldMetadatas: labelUpdates,
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
          fromToAllFlatEntityMaps,
        },
      );

    if (result.status === 'fail') {
      throw new Error(
        `Company calculated fields rollback failed for workspace ${workspaceId}: ${JSON.stringify(result)}`,
      );
    }

    if (!dryRun && isDefined(dataSource)) {
      await dataSource.query(
        `UPDATE "core"."fieldMetadata" SET "applicationId" = $1
        WHERE "workspaceId" = $2 AND "universalIdentifier" = $3 AND "applicationId" = $4`,
        [
          workspaceCustomFlatApplication.id,
          workspaceId,
          LIFECYCLE_STAGE_UNIVERSAL_IDENTIFIER,
          twentyStandardFlatApplication.id,
        ],
      );
      await this.workspaceCacheService.invalidateAndRecompute(workspaceId, [
        'flatFieldMetadataMaps',
      ]);
    }

    this.logger.log(
      `${dryRun ? '[DRY RUN] ' : ''}Workspace ${workspaceId}: company calculated fields rolled back`,
    );
  }

  // Moves the field to the standard application without touching its id, column, options or data
  private async promoteCustomLifecycleStageField({
    workspaceId,
    dataSource,
    twentyStandardApplicationId,
    dryRun,
  }: {
    workspaceId: string;
    dataSource: NonNullable<RunOnWorkspaceArgs['dataSource']>;
    twentyStandardApplicationId: string;
    dryRun: boolean;
  }) {
    const rows: {
      id: string;
      type: string;
      applicationId: string;
      universalIdentifier: string;
      options: { value: string }[] | null;
    }[] = await dataSource.query(
      `SELECT f."id", f."type", f."applicationId", f."universalIdentifier", f."options"
      FROM "core"."fieldMetadata" f
      JOIN "core"."objectMetadata" o ON o."id" = f."objectMetadataId"
      WHERE f."workspaceId" = $1 AND o."universalIdentifier" = $2 AND f."name" = 'lifecycleStage'`,
      [workspaceId, STANDARD_OBJECTS.company.universalIdentifier],
    );

    const [customField] = rows;

    if (
      !isDefined(customField) ||
      customField.applicationId === twentyStandardApplicationId
    ) {
      return;
    }

    const optionValues = (customField.options ?? [])
      .map(({ value }) => value)
      .sort();

    if (
      customField.type !== FieldMetadataType.SELECT ||
      JSON.stringify(optionValues) !==
        JSON.stringify([...LIFECYCLE_STAGE_OPTION_VALUES].sort())
    ) {
      throw new Error(
        `Workspace ${workspaceId}: company lifecycleStage is a custom ${customField.type} field with options ${optionValues.join(', ')}, so it cannot be made native in place. Align it with the 11 standard options, then rerun the upgrade.`,
      );
    }

    if (dryRun) {
      this.logger.log(
        `[DRY RUN] Workspace ${workspaceId}: would make the custom lifecycleStage field native`,
      );

      return;
    }

    await dataSource.query(
      `UPDATE "core"."fieldMetadata"
      SET "applicationId" = $1, "universalIdentifier" = $2, "icon" = COALESCE("icon", 'IconProgressCheck')
      WHERE "id" = $3`,
      [
        twentyStandardApplicationId,
        LIFECYCLE_STAGE_UNIVERSAL_IDENTIFIER,
        customField.id,
      ],
    );

    await this.workspaceCacheService.invalidateAndRecompute(workspaceId, [
      'flatFieldMetadataMaps',
    ]);

    this.logger.log(
      `Workspace ${workspaceId}: made the custom lifecycleStage field native in place`,
    );
  }
}

const withFieldMetadataUpdates = ({
  fromToAllFlatEntityMaps,
  existingFlatFieldMetadataMaps,
  flatFieldMetadatas,
}: {
  fromToAllFlatEntityMaps: FromToAllUniversalFlatEntityMaps;
  existingFlatFieldMetadataMaps: FlatEntityMaps<FlatFieldMetadata>;
  flatFieldMetadatas: FlatFieldMetadata[];
}): FromToAllUniversalFlatEntityMaps => {
  const fieldMetadataFromTo = fromToAllFlatEntityMaps.flatFieldMetadataMaps;
  const from = fieldMetadataFromTo?.from ?? existingFlatFieldMetadataMaps;
  const to = (fieldMetadataFromTo?.to ??
    existingFlatFieldMetadataMaps) as FlatEntityMaps<FlatFieldMetadata>;

  return {
    ...fromToAllFlatEntityMaps,
    flatFieldMetadataMaps: {
      from,
      to: replaceFlatFieldMetadatas(to, flatFieldMetadatas),
    },
  } as FromToAllUniversalFlatEntityMaps;
};

const replaceFlatFieldMetadatas = (
  flatFieldMetadataMaps: FlatEntityMaps<FlatFieldMetadata>,
  flatFieldMetadatas: FlatFieldMetadata[],
): FlatEntityMaps<FlatFieldMetadata> => ({
  ...flatFieldMetadataMaps,
  byUniversalIdentifier: {
    ...flatFieldMetadataMaps.byUniversalIdentifier,
    ...Object.fromEntries(
      flatFieldMetadatas.map((flatFieldMetadata) => [
        flatFieldMetadata.universalIdentifier,
        flatFieldMetadata,
      ]),
    ),
  },
});
