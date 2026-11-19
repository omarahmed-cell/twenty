import { type ActivityTargetableObject } from '@/activities/types/ActivityTargetableEntity';
import { LINKED_EMAIL_RECORD_GQL_FIELDS } from '@/activities/unified-emails/constants/LinkedEmailRecordGqlFields';
import { type LinkedEmail } from '@/activities/unified-emails/types/LinkedEmail';
import { getActivityTargetsFilter } from '@/activities/utils/getActivityTargetsFilter';
import { objectMetadataItemsSelector } from '@/object-metadata/states/objectMetadataItemsSelector';
import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { CoreObjectNameSingular } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

const LINKED_EMAILS_LIMIT = 200;

type EmailTargetWithEmail = {
  __typename: string;
  id: string;
  emailId: string | null;
  email?: LinkedEmail | null;
};

const compareBySentAtDescending = (first: LinkedEmail, second: LinkedEmail) =>
  (second.sentAt ?? '').localeCompare(first.sentAt ?? '');

export const useLinkedEmails = (targetRecord: ActivityTargetableObject) => {
  const objectMetadataItems = useAtomStateValue<EnrichedObjectMetadataItem[]>(
    objectMetadataItemsSelector,
  );

  const emailTargetMetadata = objectMetadataItems.find(
    (objectMetadataItem) =>
      objectMetadataItem.nameSingular === CoreObjectNameSingular.EmailTarget,
  );

  const filter = isDefined(emailTargetMetadata)
    ? getActivityTargetsFilter({
        targetableObjects: [targetRecord],
        activityTargetObjectMetadata: emailTargetMetadata,
        objectMetadataItems,
      })
    : undefined;

  const hasFilter = isDefined(filter) && filter.or.length > 0;

  const { records: emailTargets, loading } =
    useFindManyRecords<EmailTargetWithEmail>({
      objectNameSingular: CoreObjectNameSingular.EmailTarget,
      filter,
      skip: !hasFilter,
      recordGqlFields: {
        id: true,
        emailId: true,
        email: LINKED_EMAIL_RECORD_GQL_FIELDS,
      },
      orderBy: [{ createdAt: 'DescNullsLast' }],
      limit: LINKED_EMAILS_LIMIT,
    });

  const emailById = new Map<string, LinkedEmail>();

  for (const emailTarget of hasFilter ? emailTargets : []) {
    if (isDefined(emailTarget.email)) {
      emailById.set(emailTarget.email.id, emailTarget.email);
    }
  }

  return {
    emails: [...emailById.values()].sort(compareBySentAtDescending),
    loading,
  };
};
