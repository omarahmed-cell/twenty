import { getRoboostCurrencyDetails } from '@/utils/currency/getRoboostCurrencyDetails';

// "SAR 12,000.00" with the currency's own minor units
export const formatRoboostCurrencyValue = (
  value: number | null | undefined,
  code: string | null | undefined,
) => {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return '';
  }

  const decimals = code ? getRoboostCurrencyDetails(code).decimals : 2;
  const amount = value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return code ? `${code} ${amount}` : amount;
};
