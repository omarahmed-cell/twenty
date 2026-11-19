import { CoreObjectNameSingular } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

import { EmailCard } from '@/activities/unified-emails/components/EmailCard';
import { LINKED_EMAIL_RECORD_GQL_FIELDS } from '@/activities/unified-emails/constants/LinkedEmailRecordGqlFields';
import { type LinkedEmail } from '@/activities/unified-emails/types/LinkedEmail';
import { useFindOneRecord } from '@/object-record/hooks/useFindOneRecord';

type EmailTimelineCardProps = {
  emailId: string;
};

export const EmailTimelineCard = ({ emailId }: EmailTimelineCardProps) => {
  const { record: email } = useFindOneRecord<LinkedEmail>({
    objectNameSingular: CoreObjectNameSingular.Email,
    objectRecordId: emailId,
    recordGqlFields: LINKED_EMAIL_RECORD_GQL_FIELDS,
  });

  return isDefined(email) ? <EmailCard email={email} /> : null;
};
