import { isNonEmptyString } from '@sniptt/guards';
import { isDefined } from 'twenty-shared/utils';

import { BODY_PREVIEW_MAX_LENGTH } from 'src/modules/unified-email/constants/body-preview-max-length.constant';

export type EmailDerivedFieldUpdates = {
  bodyPreview?: string | null;
  source?: string;
};

type EmailRecord = Record<string, unknown> | undefined;

const getBodyMarkdown = (record: EmailRecord) => {
  const body = record?.bodyV2 as { markdown?: string | null } | undefined;

  return body?.markdown ?? null;
};

export const toBodyPreview = (markdown: string | null) => {
  if (!isNonEmptyString(markdown)) {
    return null;
  }

  const plainText = markdown
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[#*_>`~|]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return plainText.length > 0
    ? plainText.slice(0, BODY_PREVIEW_MAX_LENGTH)
    : null;
};

export const computeEmailDerivedFieldUpdates = ({
  before,
  after,
  isUpdate,
}: {
  before: EmailRecord;
  after: EmailRecord;
  isUpdate: boolean;
}): EmailDerivedFieldUpdates => {
  const updates: EmailDerivedFieldUpdates = {};
  const markdown = getBodyMarkdown(after);

  if (!isUpdate || markdown !== getBodyMarkdown(before)) {
    const bodyPreview = toBodyPreview(markdown);

    if (bodyPreview !== (after?.bodyPreview ?? null)) {
      updates.bodyPreview = bodyPreview;
    }
  }

  if (
    !isUpdate &&
    !isDefined(after?.source) &&
    isNonEmptyString(after?.hubspotId)
  ) {
    updates.source = 'HUBSPOT_IMPORT';
  }

  return updates;
};
