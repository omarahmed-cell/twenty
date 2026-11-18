import {
  formatEmailAddressList,
  parseEmailAddressList,
} from 'src/modules/unified-email/utils/format-email-address-list.util';

describe('email address lists', () => {
  it('formats names and bare addresses', () => {
    expect(
      formatEmailAddressList([
        { address: 'a@acme.com', displayName: 'Ann "A" Lee' },
        { address: 'b@acme.com' },
      ]),
    ).toBe('Ann A Lee <a@acme.com>, b@acme.com');
    expect(formatEmailAddressList([])).toBeNull();
  });

  it('parses what it formats', () => {
    expect(parseEmailAddressList('Ann Lee <a@acme.com>, b@acme.com')).toEqual([
      { address: 'a@acme.com', displayName: 'Ann Lee' },
      { address: 'b@acme.com', displayName: null },
    ]);
  });
});
