import { createHmac, timingSafeEqual } from 'crypto';

import { isNonEmptyString } from '@sniptt/guards';

export type EmailTrackingTokenPayload = {
  workspaceId: string;
  emailId: string;
  url?: string;
};

type EncodedPayload = { w: string; e: string; u?: string };

const TOKEN_FORMAT = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;

const UUID_FORMAT =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const sign = (body: string, secret: string) =>
  createHmac('sha256', `unified-email-tracking:${secret}`)
    .update(body)
    .digest('base64url');

export const encodeEmailTrackingToken = (
  payload: EmailTrackingTokenPayload,
  secret: string,
) => {
  const encoded: EncodedPayload = {
    w: payload.workspaceId,
    e: payload.emailId,
    ...(isNonEmptyString(payload.url) ? { u: payload.url } : {}),
  };
  const body = Buffer.from(JSON.stringify(encoded)).toString('base64url');

  return `${body}.${sign(body, secret)}`;
};

// A token that was changed in any way fails the signature check, so it can never redirect elsewhere
export const decodeEmailTrackingToken = (
  token: string,
  secret: string,
): EmailTrackingTokenPayload | null => {
  if (!TOKEN_FORMAT.test(token)) {
    return null;
  }

  const [body, signature] = token.split('.');
  const expected = Buffer.from(sign(body, secret));
  const received = Buffer.from(signature);

  if (
    expected.length !== received.length ||
    !timingSafeEqual(expected, received)
  ) {
    return null;
  }

  try {
    const decoded = JSON.parse(
      Buffer.from(body, 'base64url').toString('utf8'),
    ) as Partial<EncodedPayload>;

    if (
      !isNonEmptyString(decoded.w) ||
      !isNonEmptyString(decoded.e) ||
      !UUID_FORMAT.test(decoded.w) ||
      !UUID_FORMAT.test(decoded.e)
    ) {
      return null;
    }

    return {
      workspaceId: decoded.w,
      emailId: decoded.e,
      ...(isNonEmptyString(decoded.u) ? { url: decoded.u } : {}),
    };
  } catch {
    return null;
  }
};
