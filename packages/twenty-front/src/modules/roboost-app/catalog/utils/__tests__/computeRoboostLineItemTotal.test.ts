import { computeRoboostLineItemTotal } from '@/roboost-app/catalog/utils/computeRoboostLineItemTotal';

describe('computeRoboostLineItemTotal', () => {
  it('takes a percentage off quantity x unit price', () => {
    expect(
      computeRoboostLineItemTotal({
        quantity: 3,
        unitPrice: { amountMicros: 100_000_000 },
        unitDiscount: 10,
        discountType: 'PERCENTAGE',
      }),
    ).toBeCloseTo(270);
  });

  it('takes an amount off the line', () => {
    expect(
      computeRoboostLineItemTotal({
        quantity: 2,
        unitPrice: { amountMicros: 50_000_000 },
        unitDiscount: 15,
        discountType: 'AMOUNT',
      }),
    ).toBe(85);
  });

  it('has no total without a unit price', () => {
    expect(computeRoboostLineItemTotal({ quantity: 2 })).toBeNull();
  });
});
