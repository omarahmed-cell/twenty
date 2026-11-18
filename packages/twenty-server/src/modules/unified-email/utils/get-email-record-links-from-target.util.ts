import { isNonEmptyString } from '@sniptt/guards';

import { type EmailRecordLinks } from 'src/modules/unified-email/services/email-record.service';

const LINK_KEY_BY_OBJECT_NAME: Record<string, keyof EmailRecordLinks> = {
  person: 'personIds',
  company: 'companyIds',
  opportunity: 'opportunityIds',
};

export const getEmailRecordLinksFromTarget = ({
  objectNameSingular,
  recordId,
}: {
  objectNameSingular?: string | null;
  recordId?: string | null;
}): EmailRecordLinks => {
  const linkKey = isNonEmptyString(objectNameSingular)
    ? LINK_KEY_BY_OBJECT_NAME[objectNameSingular]
    : undefined;

  return linkKey !== undefined && isNonEmptyString(recordId)
    ? { [linkKey]: [recordId] }
    : {};
};
