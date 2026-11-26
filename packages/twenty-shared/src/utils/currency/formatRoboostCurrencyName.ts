import { getRoboostCurrencyDetails } from '@/utils/currency/getRoboostCurrencyDetails';

// "Saudi Riyal (SAR) SR", as in HubSpot's currency lists
export const formatRoboostCurrencyName = (code: string) => {
  const { name, symbol } = getRoboostCurrencyDetails(code);

  return `${name} (${code}) ${symbol}`;
};
