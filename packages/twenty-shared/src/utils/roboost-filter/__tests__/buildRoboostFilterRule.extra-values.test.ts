import { buildRoboostFilterRule } from '@/utils/roboost-filter/buildRoboostFilterRule';

describe('buildRoboostFilterRule extra emails and domains', () => {
  it('matches the primary or an additional email', () => {
    expect(
      buildRoboostFilterRule({
        field: { name: 'emails', type: 'EMAILS' },
        operator: 'containsAnyOf',
        value: 'acme.com',
      } as Parameters<typeof buildRoboostFilterRule>[0]),
    ).toEqual({
      or: [
        { emails: { primaryEmail: { ilike: '%acme.com%' } } },
        { emails: { additionalEmails: { ilike: '%acme.com%' } } },
      ],
    });
  });

  it('matches an exact extra domain between JSON quotes', () => {
    expect(
      buildRoboostFilterRule({
        field: { name: 'domainName', type: 'LINKS' },
        operator: 'isEqualToAnyOf',
        value: 'dunkin.com',
      } as Parameters<typeof buildRoboostFilterRule>[0]),
    ).toEqual({
      or: [
        { domainName: { primaryLinkUrl: { ilike: 'dunkin.com' } } },
        { domainName: { secondaryLinks: { ilike: '%"dunkin.com"%' } } },
      ],
    });
  });

  it('leaves other link fields on the primary value only', () => {
    expect(
      buildRoboostFilterRule({
        field: { name: 'linkedinLink', type: 'LINKS' },
        operator: 'containsAnyOf',
        value: 'acme',
      } as Parameters<typeof buildRoboostFilterRule>[0]),
    ).toEqual({ linkedinLink: { primaryLinkUrl: { ilike: '%acme%' } } });
  });
});
