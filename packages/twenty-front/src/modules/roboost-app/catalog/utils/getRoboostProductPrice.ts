import { type RoboostCurrency } from '@/roboost-app/currencies/types/RoboostCurrency';
import { getRoboostPriceFieldName } from '@/roboost-app/catalog/utils/getRoboostPriceFieldName';
import { isDefined } from 'twenty-shared/utils';

export type RoboostProductPrice = {
  price: number | null;
  isConverted: boolean;
};

// A currency's rate is what one unit is worth in the company currency (the company currency itself is 1)
const getRate = (
  code: string,
  companyCode: string,
  byCode: ReadonlyMap<string, RoboostCurrency>,
) => (code === companyCode ? 1 : byCode.get(code)?.rate);

export const convertRoboostAmount = ({
  amount,
  fromCode,
  toCode,
  companyCode,
  byCode,
}: {
  amount: number;
  fromCode: string;
  toCode: string;
  companyCode: string;
  byCode: ReadonlyMap<string, RoboostCurrency>;
}): number | null => {
  if (fromCode === toCode) {
    return amount;
  }
  const fromRate = getRate(fromCode, companyCode, byCode);
  const toRate = getRate(toCode, companyCode, byCode);

  return isDefined(fromRate) && isDefined(toRate) && toRate > 0
    ? (amount * fromRate) / toRate
    : null;
};

// The product's own price in that currency, else its company-currency price converted at today's rate
export const getRoboostProductPrice = ({
  product,
  currencyCode,
  companyCode,
  byCode,
}: {
  product: Record<string, unknown>;
  currencyCode: string;
  companyCode: string;
  byCode: ReadonlyMap<string, RoboostCurrency>;
}): RoboostProductPrice => {
  const own = product[getRoboostPriceFieldName(currencyCode)];

  if (typeof own === 'number') {
    return { price: own, isConverted: false };
  }
  const companyPrice = product[getRoboostPriceFieldName(companyCode)];
  const price =
    typeof companyPrice === 'number'
      ? convertRoboostAmount({
          amount: companyPrice,
          fromCode: companyCode,
          toCode: currencyCode,
          companyCode,
          byCode,
        })
      : null;

  return { price, isConverted: isDefined(price) };
};
