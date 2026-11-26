import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  type OnModuleInit,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';

import { STANDARD_OBJECTS } from 'twenty-shared/metadata';
import { isDefined } from 'twenty-shared/utils';
import { DataSource } from 'typeorm';

import { ApplicationService } from 'src/engine/core-modules/application/application.service';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { FieldMetadataService } from 'src/engine/metadata-modules/field-metadata/services/field-metadata.service';
import { findFlatEntityByUniversalIdentifier } from 'src/engine/metadata-modules/flat-entity/utils/find-flat-entity-by-universal-identifier.util';
import { type FlatFieldMetadata } from 'src/engine/metadata-modules/flat-field-metadata/types/flat-field-metadata.type';
import { WorkspaceManyOrAllFlatEntityMapsCacheService } from 'src/engine/metadata-modules/flat-entity/services/workspace-many-or-all-flat-entity-maps-cache.service';
import { getWorkspaceSchemaName } from 'src/engine/workspace-datasource/utils/get-workspace-schema-name.util';
import { RoboostCurrencyHooksService } from 'src/modules/roboost-currency/services/roboost-currency-hooks.service';
import { RoboostCurrencyService } from 'src/modules/roboost-currency/services/roboost-currency.service';
import { OpportunityCalculationQueueService } from 'src/modules/opportunity-calculated-fields/services/opportunity-calculation-queue.service';

type DealData = Record<string, unknown>;

const CURRENCY_OPTION_COLORS = [
  'green',
  'blue',
  'turquoise',
  'orange',
  'purple',
  'sky',
  'pink',
  'yellow',
  'red',
  'gray',
];

// Deal Currency options follow Settings > Currencies; exchange rates follow the rate table
@Injectable()
export class RoboostDealMoneyService implements OnModuleInit {
  private readonly logger = new Logger(RoboostDealMoneyService.name);

  constructor(
    @InjectDataSource()
    private readonly coreDataSource: DataSource,
    private readonly roboostCurrencyService: RoboostCurrencyService,
    private readonly roboostCurrencyHooksService: RoboostCurrencyHooksService,
    private readonly opportunityCalculationQueueService: OpportunityCalculationQueueService,
    private readonly fieldMetadataService: FieldMetadataService,
    private readonly applicationService: ApplicationService,
    private readonly flatEntityMapsCacheService: WorkspaceManyOrAllFlatEntityMapsCacheService,
  ) {}

  onModuleInit() {
    this.roboostCurrencyHooksService.onCurrenciesChanged((workspaceId) =>
      this.syncCurrencyOptions(workspaceId).then(() => undefined),
    );
    this.roboostCurrencyHooksService.onRatesChanged(
      (workspaceId, { includeClosed }) =>
        this.recalculateDeals(workspaceId, { includeClosed }),
    );
  }

  private schema(workspaceId: string) {
    return `"${getWorkspaceSchemaName(workspaceId)}"`;
  }

  // Every currency ever added stays an option (old deals keep showing it); new deals default to the company currency
  async syncCurrencyOptions(workspaceId: string): Promise<boolean> {
    const currencies =
      await this.roboostCurrencyService.listCurrencies(workspaceId);
    const companyCurrency = currencies.find(
      ({ isCompanyCurrency }) => isCompanyCurrency,
    );

    if (currencies.length === 0 || !isDefined(companyCurrency)) {
      return false;
    }
    const { flatFieldMetadataMaps } =
      await this.flatEntityMapsCacheService.getOrRecomputeManyOrAllFlatEntityMaps(
        { workspaceId, flatMapsKeys: ['flatFieldMetadataMaps'] },
      );
    const field = findFlatEntityByUniversalIdentifier<FlatFieldMetadata>({
      flatEntityMaps: flatFieldMetadataMaps,
      universalIdentifier:
        STANDARD_OBJECTS.opportunity.fields.currency.universalIdentifier,
    });

    if (!isDefined(field)) {
      return false;
    }
    const existing = (field.options ?? []) as unknown as {
      id: string;
      value: string;
      color: string;
    }[];
    const options = currencies.map((currency, position) => {
      const previous = existing.find(({ value }) => value === currency.code);

      return {
        ...(isDefined(previous) ? { id: previous.id } : {}),
        value: currency.code,
        label: currency.code,
        position,
        color:
          previous?.color ??
          CURRENCY_OPTION_COLORS[position % CURRENCY_OPTION_COLORS.length],
      };
    });
    const defaultValue = `'${companyCurrency.code}'`;
    const isSame =
      field.defaultValue === defaultValue &&
      JSON.stringify(existing.map(({ value }) => value)) ===
        JSON.stringify(options.map(({ value }) => value));

    if (isSame) {
      return false;
    }
    const { twentyStandardFlatApplication } =
      await this.applicationService.findWorkspaceTwentyStandardAndCustomApplicationOrThrow(
        { workspaceId },
      );

    await this.fieldMetadataService.updateOneField({
      workspaceId,
      isSystemBuild: true,
      ownerFlatApplication: twentyStandardFlatApplication,
      updateFieldInput: { id: field.id, options, defaultValue },
    });
    this.logger.log(
      `Workspace ${workspaceId}: deal Currency options synced (${options.length})`,
    );

    return true;
  }

  // New rates reach open deals (and, after a company currency change, closed ones too) through the recompute queue
  async recalculateDeals(
    workspaceId: string,
    { includeClosed }: { includeClosed: boolean },
  ) {
    const schema = this.schema(workspaceId);

    if (includeClosed) {
      await this.coreDataSource.query(
        `UPDATE ${schema}."opportunity" SET "exchangeRateMode" = 'AUTO' WHERE "exchangeRateMode" = 'FROZEN'`,
      );
    }
    const rows: { id: string }[] = await this.coreDataSource.query(
      `SELECT id FROM ${schema}."opportunity" WHERE "deletedAt" IS NULL
      ${includeClosed ? '' : `AND (coalesce("isClosed", false) = false OR "closeDate" > now())`}`,
    );

    await this.opportunityCalculationQueueService.enqueueReferences({
      workspaceId,
      references: rows.map(({ id }) => `opportunity:${id}`),
    });
  }

  private async canSetExchangeRate(authContext: WorkspaceAuthContext) {
    if (authContext.type !== 'user') {
      return true;
    }

    return this.roboostCurrencyService.isAdmin(
      authContext.workspace.id,
      authContext.workspaceMemberId,
    );
  }

  private async assertCurrencyAllowed(
    workspaceId: string,
    currency: unknown,
    currentCurrencies: (string | null)[] = [],
  ) {
    if (
      !isDefined(currency) ||
      currentCurrencies.includes(currency as string)
    ) {
      return;
    }
    const known = await this.roboostCurrencyService.listCurrencies(workspaceId);
    const match = known.find(({ code }) => code === currency);

    if (!isDefined(match)) {
      throw new BadRequestException(
        `${String(currency)} is not one of the workspace currencies (Settings > Currencies)`,
      );
    }
    if (match.isArchived) {
      throw new BadRequestException(
        `${match.code} is archived and can't be chosen on a deal`,
      );
    }
  }

  private async applyExchangeRateEdit(
    authContext: WorkspaceAuthContext,
    data: DealData,
  ): Promise<DealData> {
    if (!('exchangeRate' in data)) {
      return data;
    }
    if (!(await this.canSetExchangeRate(authContext))) {
      throw new ForbiddenException('Only admins can change the exchange rate');
    }

    return {
      ...data,
      exchangeRateMode: isDefined(data.exchangeRate) ? 'MANUAL' : 'AUTO',
    };
  }

  async prepareCreate(
    authContext: WorkspaceAuthContext,
    records: DealData[],
  ): Promise<DealData[]> {
    const prepared: DealData[] = [];

    for (const record of records) {
      await this.assertCurrencyAllowed(
        authContext.workspace.id,
        record.currency,
      );
      const { exchangeRateMode: _ignored, ...rest } = record;

      prepared.push(await this.applyExchangeRateEdit(authContext, rest));
    }

    return prepared;
  }

  async prepareUpdate(
    authContext: WorkspaceAuthContext,
    ids: string[],
    data: DealData,
  ): Promise<DealData> {
    const workspaceId = authContext.workspace.id;
    const { exchangeRateMode: _ignored, ...rest } = data;

    if ('currency' in rest || 'closeDate' in rest || 'stage' in rest) {
      const current: {
        id: string;
        currency: string | null;
        exchangeRateMode: string | null;
      }[] =
        ids.length > 0
          ? await this.coreDataSource.query(
              `SELECT id, currency::text AS currency, "exchangeRateMode"::text AS "exchangeRateMode"
              FROM ${this.schema(workspaceId)}."opportunity" WHERE id = ANY($1::uuid[])`,
              [ids],
            )
          : [];

      await this.assertCurrencyAllowed(
        workspaceId,
        rest.currency,
        current.map(({ currency }) => currency),
      );
      const currencyChanged =
        'currency' in rest &&
        current.some(({ currency }) => currency !== rest.currency);
      const isFrozen = current.some(
        ({ exchangeRateMode }) => exchangeRateMode === 'FROZEN',
      );

      // A new currency, close date or stage re-picks the rate; an admin's rate only goes with a new currency
      if (!('exchangeRate' in rest) && (currencyChanged || isFrozen)) {
        const prepared = await this.applyExchangeRateEdit(authContext, rest);

        return currencyChanged
          ? { ...prepared, exchangeRateMode: 'AUTO' }
          : {
              ...prepared,
              exchangeRateMode: 'AUTO',
              ...this.keepManual(current),
            };
      }
    }

    return this.applyExchangeRateEdit(authContext, rest);
  }

  private keepManual(current: { exchangeRateMode: string | null }[]): DealData {
    return current.every(
      ({ exchangeRateMode }) => exchangeRateMode === 'MANUAL',
    )
      ? { exchangeRateMode: 'MANUAL' }
      : {};
  }
}
