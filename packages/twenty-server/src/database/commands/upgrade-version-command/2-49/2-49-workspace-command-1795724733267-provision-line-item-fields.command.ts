import { Command } from 'nest-commander';
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
  countSeededStandardAdditions,
} from 'src/database/commands/upgrade-version-command/2-49/utils/build-seeded-standard-additions-from-to.util';
import { ACTIVITY_OBJECTS_FLAT_ENTITY_MAPS_KEYS } from 'src/database/commands/upgrade-version-command/2-49/utils/select-activity-objects-standard-additions.util';
import { ApplicationService } from 'src/engine/core-modules/application/application.service';
import { RegisteredWorkspaceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-workspace-command.decorator';
import { FieldMetadataService } from 'src/engine/metadata-modules/field-metadata/services/field-metadata.service';
import { type FlatFieldMetadata } from 'src/engine/metadata-modules/flat-field-metadata/types/flat-field-metadata.type';
import { WorkspaceCacheService } from 'src/engine/workspace-cache/services/workspace-cache.service';
import { computeTwentyStandardApplicationAllFlatEntityMaps } from 'src/engine/workspace-manager/twenty-standard-application/utils/twenty-standard-application-all-flat-entity-maps.constant';
import { WorkspaceMigrationValidateBuildAndRunService } from 'src/engine/workspace-manager/workspace-migration/services/workspace-migration-validate-build-and-run-service';
import { RoboostLineItemService } from 'src/modules/roboost-catalog/services/roboost-line-item.service';

const LINE_ITEM_FIELDS = STANDARD_OBJECTS.lineItem.fields;

const LINE_ITEM_SEED_UNIVERSAL_IDENTIFIERS = [
  LINE_ITEM_FIELDS.sku.universalIdentifier,
  LINE_ITEM_FIELDS.description.universalIdentifier,
  LINE_ITEM_FIELDS.unitCost.universalIdentifier,
  LINE_ITEM_FIELDS.discountType.universalIdentifier,
  LINE_ITEM_FIELDS.source.universalIdentifier,
  LINE_ITEM_FIELDS.totalInCompanyCurrency.universalIdentifier,
  LINE_ITEM_FIELDS.isPriceConverted.universalIdentifier,
];

@RegisteredWorkspaceCommand('2.49.0', 1795724733267)
@Command({
  name: 'upgrade:2-49:provision-line-item-fields',
  description:
    'Add SKU, Description, Unit cost, Discount type, Source, Total in company currency and Price converted to line items, turn Unit discount into Discount (percentage or amount), and compute every line total',
})
export class ProvisionLineItemFieldsCommand extends ProvisionedWorkspaceCommandRunner<ProvisionedWorkspaceCommandOptions> {
  constructor(
    protected readonly workspaceIteratorService: WorkspaceIteratorService,
    private readonly applicationService: ApplicationService,
    private readonly workspaceCacheService: WorkspaceCacheService,
    private readonly workspaceMigrationValidateBuildAndRunService: WorkspaceMigrationValidateBuildAndRunService,
    private readonly fieldMetadataService: FieldMetadataService,
    private readonly roboostLineItemService: RoboostLineItemService,
  ) {
    super(workspaceIteratorService);
  }

  override async runOnWorkspace(
    args: RunOnWorkspaceArgs<ProvisionedWorkspaceCommandOptions>,
  ): Promise<void> {
    await this.up(args);
  }

  async up({
    workspaceId,
    dataSource,
    options,
  }: RunOnWorkspaceArgs<ProvisionedWorkspaceCommandOptions>) {
    if (!isDefined(dataSource)) {
      throw new Error(`Workspace ${workspaceId}: no data source`);
    }
    if (options.dryRun ?? false) {
      this.logger.log(
        `[DRY RUN] Workspace ${workspaceId}: would add the line item fields`,
      );

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
    const provision = buildSeededStandardAdditionsFromTo({
      existing,
      standard,
      seedUniversalIdentifiers: LINE_ITEM_SEED_UNIVERSAL_IDENTIFIERS,
    });
    const additionCount = countSeededStandardAdditions(provision.additions);

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
          `Line item fields provisioning failed for workspace ${workspaceId}: ${JSON.stringify(result)}`,
        );
      }
    }

    const current = await this.workspaceCacheService.getOrRecompute(
      workspaceId,
      ['flatFieldMetadataMaps'],
    );
    const discountField = current.flatFieldMetadataMaps.byUniversalIdentifier[
      LINE_ITEM_FIELDS.unitDiscount.universalIdentifier
    ] as FlatFieldMetadata | undefined;
    const standardDiscountField = standard.flatFieldMetadataMaps
      .byUniversalIdentifier[
      LINE_ITEM_FIELDS.unitDiscount.universalIdentifier
    ] as FlatFieldMetadata | undefined;

    if (
      isDefined(discountField) &&
      isDefined(standardDiscountField) &&
      discountField.label !== standardDiscountField.label
    ) {
      await this.fieldMetadataService.updateOneField({
        workspaceId,
        isSystemBuild: true,
        ownerFlatApplication: twentyStandardFlatApplication,
        updateFieldInput: {
          id: discountField.id,
          label: standardDiscountField.label,
          description: standardDiscountField.description ?? undefined,
          settings: standardDiscountField.settings,
        },
      });
    }

    await this.roboostLineItemService.recompute(workspaceId, 'all', []);

    this.logger.log(
      `Workspace ${workspaceId}: ${additionCount} line item field addition(s), line totals computed`,
    );
  }

  async down({
    workspaceId,
  }: RunOnWorkspaceArgs<ProvisionedWorkspaceCommandOptions>) {
    this.logger.log(
      `Workspace ${workspaceId}: line item fields hold data and are kept`,
    );
  }
}
