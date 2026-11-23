import { isNonEmptyString } from '@sniptt/guards';

export type RoboostEmailAddress = { name: string; email: string };

// "Ann Lee <ann@acme.com>, bob@acme.com" -> [{ Ann Lee, ann@acme.com }, { bob@acme.com, bob@acme.com }]
export const parseRoboostEmailAddresses = (
  value: string | null | undefined,
): RoboostEmailAddress[] =>
  (value ?? '')
    .split(/[,;](?=(?:[^"]*"[^"]*")*[^"]*$)/)
    .map((part) => part.trim())
    .filter(isNonEmptyString)
    .map((part) => {
      const match = part.match(/^(.*)<([^>]+)>$/);
      const email = (match?.[2] ?? part).trim().toLowerCase();
      const name = match?.[1].replace(/"/g, '').trim();

      return { name: isNonEmptyString(name) ? name : email, email };
    });
