import { computeEmailDerivedFieldUpdates } from 'src/modules/unified-email/utils/compute-email-derived-field-updates.util';

describe('computeEmailDerivedFieldUpdates', () => {
  it('builds a plain-text preview and marks HubSpot rows on create', () => {
    expect(
      computeEmailDerivedFieldUpdates({
        before: undefined,
        after: {
          bodyV2: {
            markdown: '# Hello **there**, see [the deck](https://x.io)',
          },
          hubspotId: '123',
          source: null,
        },
        isUpdate: false,
      }),
    ).toEqual({
      bodyPreview: 'Hello there , see the deck',
      source: 'HUBSPOT_IMPORT',
    });
  });

  it('leaves an update alone when the body did not change', () => {
    expect(
      computeEmailDerivedFieldUpdates({
        before: { bodyV2: { markdown: 'same' } },
        after: { bodyV2: { markdown: 'same' }, hubspotId: '1' },
        isUpdate: true,
      }),
    ).toEqual({});
  });

  it('keeps an explicit source', () => {
    expect(
      computeEmailDerivedFieldUpdates({
        before: undefined,
        after: { source: 'CRM', hubspotId: '1', bodyPreview: null },
        isUpdate: false,
      }),
    ).toEqual({});
  });
});
