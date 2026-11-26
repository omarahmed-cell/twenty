import {
  BadRequestException,
  Injectable,
  Logger,
  type OnModuleInit,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';

import { STANDARD_OBJECTS } from 'twenty-shared/metadata';
import { FieldMetadataType, NumberDataType } from 'twenty-shared/types';
import { getRoboostCurrencyDetails, isDefined } from 'twenty-shared/utils';
import { DataSource } from 'typeorm';

import { FieldMetadataService } from 'src/engine/metadata-modules/field-metadata/services/field-metadata.service';
import { WorkspaceManyOrAllFlatEntityMapsCacheService } from 'src/engine/metadata-modules/flat-entity/services/workspace-many-or-all-flat-entity-maps-cache.service';
import { getWorkspaceSchemaName } from 'src/engine/workspace-datasource/utils/get-workspace-schema-name.util';
import { RoboostCurrencyHooksService } from 'src/modules/roboost-currency/services/roboost-currency-hooks.service';
import { RoboostCurrencyService } from 'src/modules/roboost-currency/services/roboost-currency.service';

const PRICE_FIELD_DESCRIPTION_MARKER = 'Managed by Settings > Currencies';

// "SAR" -> "priceSar"; one product price field per workspace currency
export const getRoboostPriceFieldName = (code: string) =>
  `price${code.charAt(0)}${code.slice(1).toLowerCase()}`;

type FieldRow = {
  id: string;
  name: string;
  isActive: boolean;
};

// Product prices live in one number field per currency; the currency list creates and archives them
@Injectable()
export class RoboostProductPriceService implements OnModuleInit {
  private readonly logger = new Logger(RoboostProductPriceService.name);

  constructor(
    @InjectDataSource()
    private readonly coreDataSource: DataSource,
    private readonly roboostCurrencyService: RoboostCurrencyService,
    private readonly roboostCurrencyHooksService: RoboostCurrencyHooksService,
    private readonly fieldMetadataService: FieldMetadataService,
    private readonly flatEntityMapsCacheService: WorkspaceManyOrAllFlatEntityMapsCacheService,
  ) {}

  onModuleInit() {
    this.roboostCurrencyHooksService.onCurrenciesChanged(
      async (workspaceId) => {
        await this.syncPriceFields(workspaceId);
        await this.recomputeMargins(workspaceId);
      },
    );
  }

  private schema(workspaceId: string) {
    return `"${getWorkspaceSchemaName(workspaceId)}"`;
  }

  private async getProductObjectId(
    workspaceId: string,
  ): Promise<string | null> {
    const [row]: { id: string }[] = await this.coreDataSource.query(
      `SELECT id FROM core."objectMetadata" WHERE "workspaceId" = $1 AND "universalIdentifier" = $2`,
      [workspaceId, STANDARD_OBJECTS.product.universalIdentifier],
    );

    return row?.id ?? null;
  }

  async listPriceFields(workspaceId: string): Promise<FieldRow[]> {
    const objectId = await this.getProductObjectId(workspaceId);

    if (!isDefined(objectId)) {
      return [];
    }

    return this.coreDataSource.query(
      `SELECT id, name, "isActive" FROM core."fieldMetadata"
      WHERE "objectMetadataId" = $1 AND name ~ '^price[A-Z][a-z]{2}$' AND description LIKE '%' || $2 || '%'`,
      [objectId, PRICE_FIELD_DESCRIPTION_MARKER],
    );
  }

  // Active currencies get an active price field, archived ones keep theirs inactive (prices stay)
  async syncPriceFields(workspaceId: string) {
    const objectId = await this.getProductObjectId(workspaceId);

    if (!isDefined(objectId)) {
      return;
    }
    const currencies =
      await this.roboostCurrencyService.listCurrencies(workspaceId);
    const existing = new Map(
      (await this.listPriceFields(workspaceId)).map((field) => [
        field.name,
        field,
      ]),
    );
    let changed = 0;

    for (const currency of currencies) {
      const name = getRoboostPriceFieldName(currency.code);
      const field = existing.get(name);
      const shouldBeActive = !currency.isArchived;

      if (!isDefined(field)) {
        if (!shouldBeActive) {
          continue;
        }
        const { decimals, name: currencyName } = getRoboostCurrencyDetails(
          currency.code,
        );

        await this.fieldMetadataService.createOneField({
          workspaceId,
          createFieldInput: {
            objectMetadataId: objectId,
            type: FieldMetadataType.NUMBER,
            name,
            label: `Price ${currency.code}`,
            description: `Unit price in ${currencyName}. ${PRICE_FIELD_DESCRIPTION_MARKER}.`,
            icon: 'IconCurrency',
            isNullable: true,
            settings: {
              dataType: NumberDataType.FLOAT,
              decimals,
              type: 'number',
            },
          },
        });
        changed += 1;
        continue;
      }
      if (field.isActive !== shouldBeActive) {
        await this.fieldMetadataService.updateOneField({
          workspaceId,
          updateFieldInput: { id: field.id, isActive: shouldBeActive },
        });
        changed += 1;
      }
    }

    if (changed > 0) {
      this.logger.log(
        `Workspace ${workspaceId}: ${changed} product price field(s) created or (un)archived`,
      );
    }
  }

  async getCompanyPriceFieldName(workspaceId: string) {
    return getRoboostPriceFieldName(
      await this.roboostCurrencyService.getCompanyCurrency(workspaceId),
    );
  }

  // Margin = price in company currency - unit cost, in company currency
  async recomputeMargins(workspaceId: string, productIds?: string[]) {
    const companyCurrency =
      await this.roboostCurrencyService.getCompanyCurrency(workspaceId);
    const priceField = getRoboostPriceFieldName(companyCurrency);
    const { flatFieldMetadataMaps } =
      await this.flatEntityMapsCacheService.getOrRecomputeManyOrAllFlatEntityMaps(
        { workspaceId, flatMapsKeys: ['flatFieldMetadataMaps'] },
      );
    const hasPriceColumn = Object.values(
      flatFieldMetadataMaps.byUniversalIdentifier,
    ).some((field) => field?.name === priceField && field.isActive);

    if (!hasPriceColumn) {
      return;
    }
    await this.coreDataSource.query(
      `UPDATE ${this.schema(workspaceId)}."product" SET
        "marginAmountMicros" = CASE WHEN "${priceField}" IS NULL THEN NULL
          ELSE round(("${priceField}" - coalesce("unitCostAmountMicros", 0) / 1000000.0) * 1000000) END,
        "marginCurrencyCode" = CASE WHEN "${priceField}" IS NULL THEN NULL ELSE $1 END
      WHERE "deletedAt" IS NULL ${isDefined(productIds) ? 'AND id = ANY($2::uuid[])' : ''}`,
      isDefined(productIds) ? [companyCurrency, productIds] : [companyCurrency],
    );
  }

  // The company currency price is the one every other price and the margin fall back on
  async assertCompanyPrice(
    workspaceId: string,
    records: Record<string, unknown>[],
  ) {
    const priceField = await this.getCompanyPriceFieldName(workspaceId);

    for (const record of records) {
      const price = record[priceField];

      if (!isDefined(price) || price === '') {
        throw new BadRequestException(
          `Price ${priceField.slice(5).toUpperCase()} is required`,
        );
      }
    }
  }
}
