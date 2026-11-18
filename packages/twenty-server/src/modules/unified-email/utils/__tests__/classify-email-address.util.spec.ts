import {
  classifyEmailAddress,
  getRegistrableDomain,
  isLinkUrlOnDomain,
} from 'src/modules/unified-email/utils/classify-email-address.util';

const domains = {
  internalDomains: ['roboost.app'],
  personalDomains: ['gmail.com', 'outlook.com'],
};

describe('classifyEmailAddress', () => {
  it('flags internal addresses, subdomains included', () => {
    expect(
      classifyEmailAddress({ address: 'Rep@Roboost.app', ...domains }),
    ).toBe('INTERNAL');
    expect(
      classifyEmailAddress({ address: 'a@mail.roboost.app', ...domains }),
    ).toBe('INTERNAL');
  });

  it('flags personal providers', () => {
    expect(classifyEmailAddress({ address: 'x@gmail.com', ...domains })).toBe(
      'PERSONAL',
    );
  });

  it('treats other domains as business and rejects malformed addresses', () => {
    expect(
      classifyEmailAddress({ address: 'ceo@acme.co.uk', ...domains }),
    ).toBe('BUSINESS');
    expect(
      classifyEmailAddress({ address: 'not-an-address', ...domains }),
    ).toBe('INVALID');
  });
});

describe('domain matching', () => {
  it('ignores www and subdomain differences', () => {
    expect(getRegistrableDomain('mail.acme.co.uk')).toBe('acme.co.uk');
    expect(isLinkUrlOnDomain('https://www.acme.com/about', 'acme.com')).toBe(
      true,
    );
    expect(isLinkUrlOnDomain('eu.acme.com', 'acme.com')).toBe(true);
    expect(isLinkUrlOnDomain('https://acme.io', 'acme.com')).toBe(false);
  });
});
