import { isDefined } from 'twenty-shared/utils';

const DEFAULT_CURRENCY_CODE = 'USD';

export type LineItemCurrency = {
  amountMicros: number | string | null;
  currencyCode: string | null;
};

export type LineItemPricingFields = {
  name?: string | null;
  productId?: string | null;
  billingFrequency?: string | null;
  quantity?: number | null;
  unitPrice?: LineItemCurrency | null;
  unitDiscount?: number | null;
  totalPrice?: LineItemCurrency | null;
};

export type LineItemProductDefaults = {
  name: string | null;
  billingFrequency: string | null;
  unitPrice: LineItemCurrency | null;
};

const PRICING_INPUT_FIELD_NAMES = [
  'productId',
  'quantity',
  'unitPrice',
  'unitDiscount',
] as const;

const toNumberOrNull = (value: number | string | null | undefined) => {
  if (!isDefined(value) || value === '') {
    return null;
  }

  const numberValue = Number(value);

  return Number.isFinite(numberValue) ? numberValue : null;
};

const clampDiscountRatio = (unitDiscount: number | null | undefined) =>
  Math.min(Math.max(toNumberOrNull(unitDiscount) ?? 0, 0), 1);

export const computeLineItemTotalPrice = ({
  unitPrice,
  quantity,
  unitDiscount,
}: Pick<
  LineItemPricingFields,
  'unitPrice' | 'quantity' | 'unitDiscount'
>): LineItemCurrency => {
  const currencyCode = unitPrice?.currencyCode || DEFAULT_CURRENCY_CODE;
  const unitPriceMicros = toNumberOrNull(unitPrice?.amountMicros);
  const quantityValue = toNumberOrNull(quantity);

  if (!isDefined(unitPriceMicros) || !isDefined(quantityValue)) {
    return { amountMicros: null, currencyCode };
  }

  // unitDiscount is stored as a ratio by the percentage number field (10% -> 0.1)
  return {
    amountMicros: Math.round(
      unitPriceMicros * quantityValue * (1 - clampDiscountRatio(unitDiscount)),
    ),
    currencyCode,
  };
};

// Returns the fields to merge into a create or update input: product defaults when the product
// is newly selected, and a recomputed total whenever a pricing input changes
export const computeLineItemDerivedFields = ({
  input,
  existingRecord,
  selectedProduct,
}: {
  input: LineItemPricingFields;
  existingRecord: LineItemPricingFields | null;
  selectedProduct: LineItemProductDefaults | null;
}): LineItemPricingFields => {
  const derivedFields: LineItemPricingFields = {};
  const isProductNewlySelected =
    isDefined(input.productId) &&
    input.productId !== existingRecord?.productId &&
    isDefined(selectedProduct);

  if (isProductNewlySelected) {
    if (!('name' in input)) {
      derivedFields.name = selectedProduct.name;
    }

    if (!('unitPrice' in input)) {
      derivedFields.unitPrice = selectedProduct.unitPrice;
    }

    if (!('billingFrequency' in input)) {
      derivedFields.billingFrequency = selectedProduct.billingFrequency;
    }
  }

  const hasPricingInputChanged =
    existingRecord === null ||
    PRICING_INPUT_FIELD_NAMES.some((fieldName) => fieldName in input);

  if (hasPricingInputChanged) {
    const mergedFields = { ...existingRecord, ...input, ...derivedFields };

    derivedFields.totalPrice = computeLineItemTotalPrice(mergedFields);
  }

  return derivedFields;
};
