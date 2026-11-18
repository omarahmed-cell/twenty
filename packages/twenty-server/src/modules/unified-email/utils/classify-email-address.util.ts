import psl from 'psl';

import { isParsedDomain } from 'src/modules/contact-creation-manager/types/is-psl-parsed-domain.type';
import { getDomainFromEmail } from 'src/utils/get-domain-from-email';

export type EmailAddressKind = 'INTERNAL' | 'PERSONAL' | 'BUSINESS' | 'INVALID';

export const normalizeEmailAddress = (address: string) =>
  address.trim().toLowerCase();

export const getRegistrableDomain = (host: string): string | null => {
  const result = psl.parse(
    host
      .trim()
      .toLowerCase()
      .replace(/^www\./, ''),
  );

  return isParsedDomain(result) ? (result.domain ?? null) : null;
};

const isOnDomainList = (domain: string, domainList: string[]) =>
  domainList.some((listedDomain) => {
    const normalizedListedDomain = listedDomain.trim().toLowerCase();

    return (
      domain === normalizedListedDomain ||
      domain.endsWith(`.${normalizedListedDomain}`)
    );
  });

export const classifyEmailAddress = ({
  address,
  internalDomains,
  personalDomains,
}: {
  address: string;
  internalDomains: string[];
  personalDomains: string[];
}): EmailAddressKind => {
  const domain = getDomainFromEmail(normalizeEmailAddress(address));

  if (!domain || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address.trim())) {
    return 'INVALID';
  }

  if (isOnDomainList(domain, internalDomains)) {
    return 'INTERNAL';
  }

  if (isOnDomainList(domain, personalDomains)) {
    return 'PERSONAL';
  }

  return 'BUSINESS';
};

export const getHostFromLinkUrl = (linkUrl: string): string | null => {
  const trimmed = linkUrl.trim();

  if (trimmed.length === 0) {
    return null;
  }

  try {
    return new URL(
      /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`,
    ).hostname;
  } catch {
    return null;
  }
};

export const isLinkUrlOnDomain = (
  linkUrl: string,
  registrableDomain: string,
) => {
  const host = getHostFromLinkUrl(linkUrl);

  return host !== null && getRegistrableDomain(host) === registrableDomain;
};
