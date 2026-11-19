import { isNonEmptyString } from '@sniptt/guards';

// "Ann Lee <ann@acme.com>, bob@acme.com" -> ["Ann Lee", "bob@acme.com"]
export const getEmailAddressNames = (value: string | null | undefined) =>
  (value ?? '')
    .split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/)
    .map((part) => part.trim())
    .filter(isNonEmptyString)
    .map((part) => {
      const match = part.match(/^(.*)<([^>]+)>$/);
      const name = match?.[1].replace(/"/g, '').trim();

      return isNonEmptyString(name) ? name : (match?.[2] ?? part).trim();
    });
