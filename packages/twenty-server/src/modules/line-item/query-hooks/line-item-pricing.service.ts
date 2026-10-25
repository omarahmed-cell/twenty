import { Injectable } from '@nestjs/common';

import { assertIsDefinedOrThrow, isDefined } from 'twenty-shared/utils';
import { In } from 'typeorm';

import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { WorkspaceNotFoundDefaultError } from 'src/engine/core-modules/workspace/workspace.exception';
import { WorkspaceOrmManager } from 'src/engine/twenty-orm/workspace-orm.manager';
import { type LineItemWorkspaceEntity } from 'src/modules/line-item/standard-objects/line-item.workspace-entity';
import {
  computeLineItemDerivedFields,
  computeLineItemTotalPrice,
  type LineItemPricingFields,
  type LineItemProductDefaults,
} from 'src/modules/line-item/utils/compute-line-item-derived-fields.util';
import { type ProductWorkspaceEntity } from 'src/modules/product/standard-objects/product.workspace-entity';

const PRICING_FIELD_NAMES = [
  'productId',
  'quantity',
  'unitPrice',
  'unitDiscount',
  'totalPrice',
] as const;

const hasPricingField = (input: LineItemPricingFields) =>
  PRICING_FIELD_NAMES.some((fieldName) => fieldName in input);

@Injectable()
export class LineItemPricingService {
  constructor(private readonly workspaceOrmManager: WorkspaceOrmManager) {}

  async applyToCreateInputs(
    authContext: WorkspaceAuthContext,
    inputs: LineItemPricingFields[],
  ): Promise<void> {
    if (inputs.length === 0) {
      return;
    }

    assertIsDefinedOrThrow(
      authContext.workspace,
      WorkspaceNotFoundDefaultError,
    );

    await this.workspaceOrmManager.executeInWorkspaceContext(async () => {
      const productsById = await this.findProductsById(
        inputs.map((input) => input.productId),
      );

      for (const input of inputs) {
        delete input.totalPrice;

        Object.assign(
          input,
          computeLineItemDerivedFields({
            input,
            existingRecord: null,
            selectedProduct: isDefined(input.productId)
              ? (productsById.get(input.productId) ?? null)
              : null,
          }),
        );
      }
    }, authContext);
  }

  async applyToUpdateInput(
    authContext: WorkspaceAuthContext,
    lineItemId: string,
    input: LineItemPricingFields,
  ): Promise<void> {
    if (!hasPricingField(input)) {
      return;
    }

    assertIsDefinedOrThrow(
      authContext.workspace,
      WorkspaceNotFoundDefaultError,
    );

    delete input.totalPrice;

    await this.workspaceOrmManager.executeInWorkspaceContext(async () => {
      const lineItemRepository =
        this.workspaceOrmManager.getRepository<LineItemWorkspaceEntity>(
          'lineItem',
          { shouldBypassPermissionChecks: true },
        );

      const existingLineItem = await lineItemRepository.findOne({
        where: { id: lineItemId },
      });

      if (!isDefined(existingLineItem)) {
        return;
      }

      const productsById = await this.findProductsById([input.productId]);

      Object.assign(
        input,
        computeLineItemDerivedFields({
          input,
          existingRecord: existingLineItem,
          selectedProduct: isDefined(input.productId)
            ? (productsById.get(input.productId) ?? null)
            : null,
        }),
      );
    }, authContext);
  }

  // Bulk updates share one input across many rows, so totals are recomputed per row afterwards
  async recomputeTotals(
    authContext: WorkspaceAuthContext,
    lineItemIds: string[],
  ): Promise<void> {
    if (lineItemIds.length === 0) {
      return;
    }

    assertIsDefinedOrThrow(
      authContext.workspace,
      WorkspaceNotFoundDefaultError,
    );

    await this.workspaceOrmManager.executeInWorkspaceContext(async () => {
      const lineItemRepository =
        this.workspaceOrmManager.getRepository<LineItemWorkspaceEntity>(
          'lineItem',
          { shouldBypassPermissionChecks: true },
        );

      const lineItems = await lineItemRepository.find({
        where: { id: In(lineItemIds) },
      });

      for (const lineItem of lineItems) {
        const totalPrice = computeLineItemTotalPrice(lineItem);

        if (
          Number(lineItem.totalPrice?.amountMicros ?? NaN) !==
            Number(totalPrice.amountMicros ?? NaN) ||
          lineItem.totalPrice?.currencyCode !== totalPrice.currencyCode
        ) {
          await lineItemRepository.update(lineItem.id, {
            totalPrice: totalPrice as LineItemWorkspaceEntity['totalPrice'],
          });
        }
      }
    }, authContext);
  }

  private async findProductsById(
    productIds: (string | null | undefined)[],
  ): Promise<Map<string, LineItemProductDefaults>> {
    const definedProductIds = [...new Set(productIds.filter(isDefined))];

    if (definedProductIds.length === 0) {
      return new Map();
    }

    const productRepository =
      this.workspaceOrmManager.getRepository<ProductWorkspaceEntity>(
        'product',
        { shouldBypassPermissionChecks: true },
      );

    const products = await productRepository.find({
      where: { id: In(definedProductIds) },
    });

    return new Map(products.map((product) => [product.id, product]));
  }
}
