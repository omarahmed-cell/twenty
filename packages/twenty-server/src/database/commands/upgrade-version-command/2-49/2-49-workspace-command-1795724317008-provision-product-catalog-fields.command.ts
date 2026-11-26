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
import { getWorkspaceSchemaName } from 'src/engine/workspace-datasource/utils/get-workspace-schema-name.util';
import { computeTwentyStandardApplicationAllFlatEntityMaps } from 'src/engine/workspace-manager/twenty-standard-application/utils/twenty-standard-application-all-flat-entity-maps.constant';
import { WorkspaceMigrationValidateBuildAndRunService } from 'src/engine/workspace-manager/workspace-migration/services/workspace-migration-validate-build-and-run-service';
import { RoboostProductPriceService } from 'src/modules/roboost-catalog/services/roboost-product-price.service';

const PRODUCT_FIELDS = STANDARD_OBJECTS.product.fields;

const PRODUCT_SEED_UNIVERSAL_IDENTIFIERS = [
  PRODUCT_FIELDS.productDescription.universalIdentifier,
  PRODUCT_FIELDS.image.universalIdentifier,
  PRODUCT_FIELDS.isActive.universalIdentifier,
  PRODUCT_FIELDS.term.universalIdentifier,
  PRODUCT_FIELDS.margin.universalIdentifier,
];

// Replaced by one price field per currency and the rich Product description
const RETIRED_PRODUCT_FIELD_UNIVERSAL_IDENTIFIERS = [
  PRODUCT_FIELDS.unitPrice.universalIdentifier,
  PRODUCT_FIELDS.description.universalIdentifier,
];

const BILLING_FREQUENCY_UNIVERSAL_IDENTIFIERS = [
  PRODUCT_FIELDS.billingFrequency.universalIdentifier,
  STANDARD_OBJECTS.lineItem.fields.billingFrequency.universalIdentifier,
];

@RegisteredWorkspaceCommand('2.49.0', 1795724317008)
@Command({
  name: 'upgrade:2-49:provision-product-catalog-fields',
  description:
    'Add Product description, Image, Active, Term and Margin to products, one price field per workspace currency, HubSpot billing frequency labels; hide the single Unit price and the plain Description',
})
export class ProvisionProductCatalogFieldsCommand extends ProvisionedWorkspaceCommandRunner<ProvisionedWorkspaceCommandOptions> {
  constructor(
    protected readonly workspaceIteratorService: WorkspaceIteratorService,
    private readonly applicationService: ApplicationService,
    private readonly workspaceCacheService: WorkspaceCacheService,
    private readonly workspaceMigrationValidateBuildAndRunService: WorkspaceMigrationValidateBuildAndRunService,
    private readonly fieldMetadataService: FieldMetadataService,
    private readonly roboostProductPriceService: RoboostProductPriceService,
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
        `[DRY RUN] Workspace ${workspaceId}: would add the product catalog fields`,
      );

      return;
    }
    const schema = `"${getWorkspaceSchemaName(workspaceId)}"`;
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
      seedUniversalIdentifiers: PRODUCT_SEED_UNIVERSAL_IDENTIFIERS,
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
          `Product catalog fields provisioning failed for workspace ${workspaceId}: ${JSON.stringify(result)}`,
        );
      }
    }

    const copied: { id: string }[] = await dataSource.query(
      `UPDATE ${schema}."product" SET "productDescriptionMarkdown" = description
      WHERE coalesce(description, '') <> '' AND "productDescriptionMarkdown" IS NULL RETURNING id`,
    );

    const current = await this.workspaceCacheService.getOrRecompute(
      workspaceId,
      ['flatFieldMetadataMaps'],
    );
    const byIdentifier = current.flatFieldMetadataMaps.byUniversalIdentifier;

    for (const universalIdentifier of BILLING_FREQUENCY_UNIVERSAL_IDENTIFIERS) {
      const field = byIdentifier[universalIdentifier] as
        | FlatFieldMetadata
        | undefined;
      const standardField = standard.flatFieldMetadataMaps.byUniversalIdentifier[
        universalIdentifier
      ] as FlatFieldMetadata | undefined;

      if (!isDefined(field) || !isDefined(standardField)) {
        continue;
      }
      const labelByValue = new Map(
        (
          (standardField.options ?? []) as { value: string; label: string }[]
        ).map(({ value, label }) => [value, label]),
      );
      const options = (
        (field.options ?? []) as { value: string; label: string }[]
      ).map((option) => ({
        ...option,
        label: labelByValue.get(option.value) ?? option.label,
      }));

      if (JSON.stringify(options) !== JSON.stringify(field.options)) {
        await this.fieldMetadataService.updateOneField({
          workspaceId,
          isSystemBuild: true,
          ownerFlatApplication: twentyStandardFlatApplication,
          updateFieldInput: {
            id: field.id,
            options: options as unknown as FlatFieldMetadata['options'],
          },
        });
      }
    }

    for (const universalIdentifier of RETIRED_PRODUCT_FIELD_UNIVERSAL_IDENTIFIERS) {
      const field = byIdentifier[universalIdentifier];

      if (isDefined(field) && field.isActive !== false) {
        await this.fieldMetadataService.updateOneField({
          workspaceId,
          isSystemBuild: true,
          ownerFlatApplication: twentyStandardFlatApplication,
          updateFieldInput: { id: field.id, isActive: false },
        });
      }
    }

    await this.roboostProductPriceService.syncPriceFields(workspaceId);
    await this.roboostProductPriceService.recomputeMargins(workspaceId);

    this.logger.log(
      `Workspace ${workspaceId}: ${additionCount} product field addition(s), ${copied.length} description(s) copied, price fields synced`,
    );
  }

  async down({
    workspaceId,
  }: RunOnWorkspaceArgs<ProvisionedWorkspaceCommandOptions>) {
    this.logger.log(
      `Workspace ${workspaceId}: product catalog fields hold data and are kept`,
    );
  }
}
