import { addEmailTracking } from 'src/modules/unified-email/utils/add-email-tracking.util';
import { classifyEmailTrackingRequest } from 'src/modules/unified-email/utils/classify-email-tracking-request.util';
import {
  decodeEmailTrackingToken,
  encodeEmailTrackingToken,
} from 'src/modules/unified-email/utils/email-tracking-token.util';

const SECRET = 'test-secret';
const WORKSPACE_ID = '20202020-1c25-4d02-bf25-6aeccf7ea419';
const EMAIL_ID = '7ad80825-843b-48ba-a461-2f697265f2e8';

describe('email tracking tokens', () => {
  it('round-trips a signed click token', () => {
    const token = encodeEmailTrackingToken(
      {
        workspaceId: WORKSPACE_ID,
        emailId: EMAIL_ID,
        url: 'https://acme.com/a?b=1',
      },
      SECRET,
    );

    expect(decodeEmailTrackingToken(token, SECRET)).toEqual({
      workspaceId: WORKSPACE_ID,
      emailId: EMAIL_ID,
      url: 'https://acme.com/a?b=1',
    });
  });

  it('refuses a tampered destination or a foreign secret', () => {
    const token = encodeEmailTrackingToken(
      { workspaceId: WORKSPACE_ID, emailId: EMAIL_ID, url: 'https://acme.com' },
      SECRET,
    );
    const [, signature] = token.split('.');
    const forgedBody = Buffer.from(
      JSON.stringify({
        w: WORKSPACE_ID,
        e: EMAIL_ID,
        u: 'https://evil.example',
      }),
    ).toString('base64url');

    expect(
      decodeEmailTrackingToken(`${forgedBody}.${signature}`, SECRET),
    ).toBeNull();
    expect(decodeEmailTrackingToken(token, 'other-secret')).toBeNull();
    expect(decodeEmailTrackingToken('not a token', SECRET)).toBeNull();
  });
});

describe('addEmailTracking', () => {
  it('rewrites http links, leaves mailto links and appends the pixel', () => {
    const html = addEmailTracking({
      html: '<p><a href="https://acme.com/?a=1&amp;b=2">Deck</a> <a href="mailto:x@acme.com">Mail</a></p>',
      buildClickUrl: (url) => `https://t.test/c/${encodeURIComponent(url)}`,
      openPixelUrl: 'https://t.test/o/abc.gif',
    });

    expect(html).toContain(
      'href="https://t.test/c/https%3A%2F%2Facme.com%2F%3Fa%3D1%26b%3D2"',
    );
    expect(html).toContain('href="mailto:x@acme.com"');
    expect(html).toMatch(/<img src="https:\/\/t\.test\/o\/abc\.gif"[^>]*\/>$/);
  });
});

describe('classifyEmailTrackingRequest', () => {
  const sentAt = new Date('2026-11-18T10:00:00Z');

  it('counts a Gmail proxy open after the grace period', () => {
    expect(
      classifyEmailTrackingRequest({
        type: 'OPEN',
        userAgent:
          'Mozilla/5.0 (Windows NT 5.1; rv:11.0) Gecko Firefox/11.0 (via ggpht.com GoogleImageProxy)',
        hasSenderSession: false,
        occurredAt: new Date('2026-11-18T10:05:00Z'),
        sentAt,
      }),
    ).toEqual({ isProxy: true, isSender: false, isCounted: true });
  });

  it('ignores opens in the first 10 seconds, Apple prefetches and the sender', () => {
    const base = { type: 'OPEN' as const, hasSenderSession: false, sentAt };

    expect(
      classifyEmailTrackingRequest({
        ...base,
        userAgent: 'Mozilla/5.0 Chrome',
        occurredAt: new Date('2026-11-18T10:00:05Z'),
      }).isCounted,
    ).toBe(false);
    expect(
      classifyEmailTrackingRequest({
        ...base,
        userAgent: 'Mozilla/5.0',
        occurredAt: new Date('2026-11-18T11:00:00Z'),
      }),
    ).toEqual({ isProxy: true, isSender: false, isCounted: false });
    expect(
      classifyEmailTrackingRequest({
        ...base,
        hasSenderSession: true,
        userAgent: 'Mozilla/5.0 Chrome',
        occurredAt: new Date('2026-11-18T11:00:00Z'),
      }),
    ).toEqual({ isProxy: false, isSender: true, isCounted: false });
  });

  it('does not count link scanners', () => {
    expect(
      classifyEmailTrackingRequest({
        type: 'CLICK',
        userAgent: 'Mozilla/5.0 (compatible; Proofpoint URL Defense)',
        hasSenderSession: false,
        occurredAt: new Date('2026-11-18T11:00:00Z'),
        sentAt,
      }).isCounted,
    ).toBe(false);
  });
});
