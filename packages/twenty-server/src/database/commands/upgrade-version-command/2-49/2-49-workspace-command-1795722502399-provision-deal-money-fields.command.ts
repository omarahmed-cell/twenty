import { Command } from 'nest-commander';
import { STANDARD_OBJECTS } from 'twenty-shared/metadata';
import { FieldMetadataType } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import { type DataSource } from 'typeorm';

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
import { WorkspaceCacheService } from 'src/engine/workspace-cache/services/workspace-cache.service';
import { getWorkspaceSchemaName } from 'src/engine/workspace-datasource/utils/get-workspace-schema-name.util';
import { computeTwentyStandardApplicationAllFlatEntityMaps } from 'src/engine/workspace-manager/twenty-standard-application/utils/twenty-standard-application-all-flat-entity-maps.constant';
import { WorkspaceMigrationValidateBuildAndRunService } from 'src/engine/workspace-manager/workspace-migration/services/workspace-migration-validate-build-and-run-service';
import { RoboostDealMoneyService } from 'src/modules/roboost-deal-money/services/roboost-deal-money.service';

const OPPORTUNITY_FIELDS = STANDARD_OBJECTS.opportunity.fields;

// Created as custom CURRENCY fields by the field round; made native in place so their ids and views stay
const PROMOTED_FIELDS = [
  'amountInCompanyCurrency',
  'weightedAmountInCompanyCurrency',
] as const;

const DEAL_MONEY_SEED_UNIVERSAL_IDENTIFIERS = [
  OPPORTUNITY_FIELDS.currency.universalIdentifier,
  OPPORTUNITY_FIELDS.dealAmount.universalIdentifier,
  OPPORTUNITY_FIELDS.exchangeRate.universalIdentifier,
  OPPORTUNITY_FIELDS.exchangeRateMode.universalIdentifier,
  OPPORTUNITY_FIELDS.amountInCompanyCurrency.universalIdentifier,
  OPPORTUNITY_FIELDS.weightedAmountInCompanyCurrency.universalIdentifier,
];

@RegisteredWorkspaceCommand('2.49.0', 1795722502399)
@Command({
  name: 'upgrade:2-49:provision-deal-money-fields',
  description:
    'Add the deal Currency, Amount (number), Exchange rate and the amounts in company currency; copy the native Amount into them; point charts, the kanban total and the creation form at the new fields; then hide the native Amount',
})
export class ProvisionDealMoneyFieldsCommand extends ProvisionedWorkspaceCommandRunner<ProvisionedWorkspaceCommandOptions> {
  constructor(
    protected readonly workspaceIteratorService: WorkspaceIteratorService,
    private readonly applicationService: ApplicationService,
    private readonly workspaceCacheService: WorkspaceCacheService,
    private readonly workspaceMigrationValidateBuildAndRunService: WorkspaceMigrationValidateBuildAndRunService,
    private readonly fieldMetadataService: FieldMetadataService,
    private readonly roboostDealMoneyService: RoboostDealMoneyService,
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
    const dryRun = options.dryRun ?? false;

    if (!isDefined(dataSource)) {
      throw new Error(`Workspace ${workspaceId}: no data source`);
    }
    const schema = `"${getWorkspaceSchemaName(workspaceId)}"`;
    const [currencyTable]: { exists: boolean }[] = await dataSource.query(
      `SELECT to_regclass($1) IS NOT NULL AS exists`,
      [`${schema}."roboostCurrency"`],
    );

    if (currencyTable?.exists !== true) {
      throw new Error(
        `Workspace ${workspaceId}: run upgrade:2-49:create-roboost-currency-tables first`,
      );
    }
    if (dryRun) {
      this.logger.log(
        `[DRY RUN] Workspace ${workspaceId}: would add the deal money fields and hide the native Amount`,
      );

      return;
    }

    const { twentyStandardFlatApplication } =
      await this.applicationService.findWorkspaceTwentyStandardAndCustomApplicationOrThrow(
        { workspaceId },
      );

    await this.promoteCustomCurrencyFields({
      workspaceId,
      dataSource,
      twentyStandardApplicationId: twentyStandardFlatApplication.id,
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
    const provision = buildSeededStandardAdditionsFromTo({
      existing,
      standard,
      seedUniversalIdentifiers: DEAL_MONEY_SEED_UNIVERSAL_IDENTIFIERS,
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
          `Deal money fields provisioning failed for workspace ${workspaceId}: ${JSON.stringify(result)}`,
        );
      }
    }

    // A deal currency that is not a workspace currency yet joins as archived, so the option exists
    const missing: { code: string }[] = await dataSource.query(
      `SELECT DISTINCT o."amountCurrencyCode" AS code FROM ${schema}."opportunity" o
      WHERE coalesce(o."amountCurrencyCode", '') <> ''
        AND NOT EXISTS (SELECT 1 FROM ${schema}."roboostCurrency" c WHERE c.code = o."amountCurrencyCode")`,
    );

    for (const { code } of missing) {
      await dataSource.query(
        `INSERT INTO ${schema}."roboostCurrency" (code, "archivedAt", "addedByName") VALUES ($1, now(), 'Deal amounts')
        ON CONFLICT (code) DO NOTHING`,
        [code],
      );
    }
    await this.roboostDealMoneyService.syncCurrencyOptions(workspaceId);

    const [{ code: companyCurrency }]: { code: string }[] =
      await dataSource.query(
        `SELECT coalesce((SELECT code FROM ${schema}."roboostCurrency" WHERE "isCompanyCurrency" LIMIT 1), 'USD') AS code`,
      );
    const migrated: { id: string }[] = await dataSource.query(
      `UPDATE ${schema}."opportunity" SET
        "dealAmount" = coalesce("dealAmount", "amountAmountMicros" / 1000000.0),
        "currency" = coalesce(nullif("amountCurrencyCode", ''), $1)::${schema}."opportunity_currency_enum"
      WHERE "dealAmount" IS NULL AND "amountAmountMicros" IS NOT NULL
      RETURNING id`,
      [companyCurrency],
    );

    await this.pointReferencesAtNewFields({ workspaceId, dataSource });
    await this.hideNativeAmount({
      workspaceId,
      twentyStandardFlatApplicationId: twentyStandardFlatApplication.id,
    });
    await this.roboostDealMoneyService.recalculateDeals(workspaceId, {
      includeClosed: true,
    });

    this.logger.log(
      `Workspace ${workspaceId}: ${additionCount} deal money field addition(s), ${migrated.length} amount(s) copied, ${missing.length} currency(ies) added from deals, native Amount hidden`,
    );
  }

  private async promoteCustomCurrencyFields({
    workspaceId,
    dataSource,
    twentyStandardApplicationId,
  }: {
    workspaceId: string;
    dataSource: DataSource;
    twentyStandardApplicationId: string;
  }) {
    let promoted = 0;

    for (const fieldName of PROMOTED_FIELDS) {
      const [field]: { id: string; type: string; applicationId: string }[] =
        await dataSource.query(
          `SELECT f."id", f."type", f."applicationId" FROM "core"."fieldMetadata" f
          JOIN "core"."objectMetadata" o ON o."id" = f."objectMetadataId"
          WHERE f."workspaceId" = $1 AND o."universalIdentifier" = $2 AND f."name" = $3`,
          [
            workspaceId,
            STANDARD_OBJECTS.opportunity.universalIdentifier,
            fieldName,
          ],
        );

      if (!isDefined(field) || field.applicationId === twentyStandardApplicationId) {
        continue;
      }
      if (field.type !== FieldMetadataType.CURRENCY) {
        throw new Error(
          `Workspace ${workspaceId}: deal field ${fieldName} is a custom ${field.type} field, not CURRENCY, so it cannot be made native in place`,
        );
      }
      await dataSource.query(
        `UPDATE "core"."fieldMetadata" SET "applicationId" = $1, "universalIdentifier" = $2, "isUIEditable" = false
        WHERE "id" = $3`,
        [
          twentyStandardApplicationId,
          OPPORTUNITY_FIELDS[fieldName].universalIdentifier,
          field.id,
        ],
      );
      promoted += 1;
    }

    if (promoted > 0) {
      await this.workspaceCacheService.invalidateAndRecompute(workspaceId, [
        'flatFieldMetadataMaps',
      ]);
    }
  }

  // Charts and the kanban total sum the amount in company currency; the creation form asks for the new Amount
  private async pointReferencesAtNewFields({
    workspaceId,
    dataSource,
  }: {
    workspaceId: string;
    dataSource: DataSource;
  }) {
    const fieldIdByName = Object.fromEntries(
      (
        (await dataSource.query(
          `SELECT f."name", f."id" FROM "core"."fieldMetadata" f
          JOIN "core"."objectMetadata" o ON o."id" = f."objectMetadataId"
          WHERE f."workspaceId" = $1 AND o."universalIdentifier" = $2
            AND f."name" IN ('amount', 'dealAmount', 'amountInCompanyCurrency')`,
          [workspaceId, STANDARD_OBJECTS.opportunity.universalIdentifier],
        )) as { name: string; id: string }[]
      ).map(({ name, id }) => [name, id]),
    );
    const { amount, dealAmount, amountInCompanyCurrency } = fieldIdByName;

    if (!isDefined(amount) || !isDefined(dealAmount) || !isDefined(amountInCompanyCurrency)) {
      return;
    }
    await dataSource.query(
      `UPDATE "core"."view" SET "kanbanAggregateOperationFieldMetadataId" = $1
      WHERE "workspaceId" = $2 AND "kanbanAggregateOperationFieldMetadataId" = $3`,
      [amountInCompanyCurrency, workspaceId, amount],
    );
    await dataSource.query(
      `UPDATE "core"."pageLayoutWidget" SET configuration = replace(configuration::text, $1, $2)::jsonb
      WHERE "workspaceId" = $3 AND type = 'FORM_FIELD' AND configuration::text LIKE '%' || $1 || '%'`,
      [amount, dealAmount, workspaceId],
    );
    await dataSource.query(
      `UPDATE "core"."pageLayoutWidget" SET configuration = replace(configuration::text, $1, $2)::jsonb
      WHERE "workspaceId" = $3 AND type <> 'FORM_FIELD' AND configuration::text LIKE '%' || $1 || '%'`,
      [amount, amountInCompanyCurrency, workspaceId],
    );
    await this.workspaceCacheService.invalidateAndRecompute(workspaceId, [
      'flatViewMaps',
      'flatPageLayoutWidgetMaps',
    ]);
  }

  private async hideNativeAmount({
    workspaceId,
    twentyStandardFlatApplicationId,
  }: {
    workspaceId: string;
    twentyStandardFlatApplicationId: string;
  }) {
    const { flatFieldMetadataMaps } =
      await this.workspaceCacheService.getOrRecompute(workspaceId, [
        'flatFieldMetadataMaps',
      ]);
    const amountField =
      flatFieldMetadataMaps.byUniversalIdentifier[
        OPPORTUNITY_FIELDS.amount.universalIdentifier
      ];

    if (!isDefined(amountField) || amountField.isActive === false) {
      return;
    }
    const { twentyStandardFlatApplication } =
      await this.applicationService.findWorkspaceTwentyStandardAndCustomApplicationOrThrow(
        { workspaceId },
      );

    if (twentyStandardFlatApplication.id !== twentyStandardFlatApplicationId) {
      return;
    }
    await this.fieldMetadataService.updateOneField({
      workspaceId,
      isSystemBuild: true,
      ownerFlatApplication: twentyStandardFlatApplication,
      updateFieldInput: { id: amountField.id, isActive: false },
    });
  }

  // The new fields hold data and the native Amount keeps its column, so down only shows the native Amount again
  async down({ workspaceId }: RunOnWorkspaceArgs<ProvisionedWorkspaceCommandOptions>) {
    const { flatFieldMetadataMaps } =
      await this.workspaceCacheService.getOrRecompute(workspaceId, [
        'flatFieldMetadataMaps',
      ]);
    const amountField =
      flatFieldMetadataMaps.byUniversalIdentifier[
        OPPORTUNITY_FIELDS.amount.universalIdentifier
      ];
    const { twentyStandardFlatApplication } =
      await this.applicationService.findWorkspaceTwentyStandardAndCustomApplicationOrThrow(
        { workspaceId },
      );

    if (isDefined(amountField) && amountField.isActive === false) {
      await this.fieldMetadataService.updateOneField({
        workspaceId,
        isSystemBuild: true,
        ownerFlatApplication: twentyStandardFlatApplication,
        updateFieldInput: { id: amountField.id, isActive: true },
      });
    }
  }
}
