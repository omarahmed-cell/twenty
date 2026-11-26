import { type CurrencyCode } from '@/constants/CurrencyCode';
import { CURRENCY_CODE_LABELS } from '@/constants/CurrencyCodeLabels';
import { ROBOOST_CURRENCY_MINOR_UNITS } from '@/constants/RoboostCurrencyMinorUnits';
import { ROBOOST_CURRENCY_SYMBOLS } from '@/constants/RoboostCurrencySymbols';

export type RoboostCurrencyDetails = {
  code: string;
  name: string;
  symbol: string;
  decimals: number;
};

export const getRoboostCurrencyDetails = (
  code: string,
): RoboostCurrencyDetails => ({
  code,
  name: (CURRENCY_CODE_LABELS[code as CurrencyCode]?.label ?? code).replace(
    /\b([a-z])/g,
    (letter) => letter.toUpperCase(),
  ),
  symbol: ROBOOST_CURRENCY_SYMBOLS[code] ?? code,
  decimals: ROBOOST_CURRENCY_MINOR_UNITS[code] ?? 2,
});
