import { t } from '@lingui/core/macro';
import { isNonEmptyString } from '@sniptt/guards';

import { type LinkedEmail } from '@/activities/unified-emails/types/LinkedEmail';
import { getEmailAddressNames } from '@/activities/unified-emails/utils/getEmailAddressNames';

const joinNames = (names: string[]) => names.join(', ');

export const getEmailHeadline = (email: LinkedEmail) => {
  const subject = isNonEmptyString(email.subject)
    ? email.subject
    : t`(no subject)`;
  const loggedByName = [
    email.loggedBy?.name?.firstName,
    email.loggedBy?.name?.lastName,
  ]
    .filter(isNonEmptyString)
    .join(' ');
  const [senderName] = getEmailAddressNames(email.from);
  const recipientNames = joinNames([
    ...getEmailAddressNames(email.to),
    ...getEmailAddressNames(email.cc),
  ]);

  if (email.direction === 'INCOMING') {
    const sender = senderName ?? '';

    return t`Incoming email - ${subject} from ${sender} to ${recipientNames}`;
  }

  const sender = isNonEmptyString(loggedByName)
    ? loggedByName
    : (senderName ?? '');

  return t`Email - ${subject} from ${sender} to ${recipientNames}`;
};
