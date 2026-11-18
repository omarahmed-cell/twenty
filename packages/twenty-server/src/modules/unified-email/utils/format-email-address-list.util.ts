import { isNonEmptyString } from '@sniptt/guards';

export const formatEmailAddressList = (
  addresses: { address: string; displayName?: string | null }[],
): string | null => {
  const formatted = addresses
    .filter(({ address }) => isNonEmptyString(address?.trim()))
    .map(({ address, displayName }) => {
      const name = displayName?.replace(/["<>]/g, '').trim();

      return isNonEmptyString(name)
        ? `${name} <${address.trim()}>`
        : address.trim();
    });

  return formatted.length > 0 ? formatted.join(', ') : null;
};

export const parseEmailAddressList = (
  value: string | null | undefined,
): { address: string; displayName: string | null }[] =>
  (value ?? '')
    .split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/)
    .map((part) => part.trim())
    .filter(isNonEmptyString)
    .map((part) => {
      const match = part.match(/^(.*)<([^>]+)>$/);

      return match
        ? {
            address: match[2].trim(),
            displayName: match[1].replace(/"/g, '').trim() || null,
          }
        : { address: part, displayName: null };
    });
