export type RoboostLineItemMoney = {
  quantity?: number | null;
  unitPrice?: { amountMicros?: number | null } | null;
  unitDiscount?: number | null;
  discountType?: string | null;
};

// Same rule as the server: quantity x unit price, less a percentage or an amount off the line
export const computeRoboostLineItemTotal = (lineItem: RoboostLineItemMoney) => {
  const unitPriceMicros = lineItem.unitPrice?.amountMicros;

  if (unitPriceMicros === null || unitPriceMicros === undefined) {
    return null;
  }
  const gross = (lineItem.quantity ?? 1) * (unitPriceMicros / 1_000_000);
  const discount = lineItem.unitDiscount ?? 0;

  return lineItem.discountType === 'AMOUNT'
    ? gross - discount
    : gross * (1 - discount / 100);
};
