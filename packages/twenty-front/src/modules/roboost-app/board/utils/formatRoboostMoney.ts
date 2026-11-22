// Currency amounts are stored in micros
export const formatRoboostMoney = (
  amountMicros: number,
  currencyCode: string,
  isCompact = false,
) => {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      notation: isCompact ? 'compact' : 'standard',
      maximumFractionDigits: isCompact ? 2 : 0,
    }).format(amountMicros / 1_000_000);
  } catch {
    return `${currencyCode} ${Math.round(amountMicros / 1_000_000).toLocaleString('en-US')}`;
  }
};
