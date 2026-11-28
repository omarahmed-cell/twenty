import {
  convertRoboostAmount,
  getRoboostProductPrice,
} from '@/roboost-app/catalog/utils/getRoboostProductPrice';
import { type RoboostCurrency } from '@/roboost-app/currencies/types/RoboostCurrency';

const byCode = new Map([
  ['SAR', { code: 'SAR', rate: 0.25 } as RoboostCurrency],
  ['EGP', { code: 'EGP', rate: 0.02 } as RoboostCurrency],
]);

describe('getRoboostProductPrice', () => {
  it("uses the product's own price in the chosen currency", () => {
    expect(
      getRoboostProductPrice({
        product: { priceSar: 400, priceUsd: 100 },
        currencyCode: 'SAR',
        companyCode: 'USD',
        byCode,
      }),
    ).toEqual({ price: 400, isConverted: false });
  });

  it("converts the company price at today's rate when the currency has no price", () => {
    expect(
      getRoboostProductPrice({
        product: { priceUsd: 100 },
        currencyCode: 'SAR',
        companyCode: 'USD',
        byCode,
      }),
    ).toEqual({ price: 400, isConverted: true });
  });
});

describe('convertRoboostAmount', () => {
  it('goes through the company currency', () => {
    expect(
      convertRoboostAmount({
        amount: 100,
        fromCode: 'SAR',
        toCode: 'EGP',
        companyCode: 'USD',
        byCode,
      }),
    ).toBeCloseTo(1250);
  });
});
