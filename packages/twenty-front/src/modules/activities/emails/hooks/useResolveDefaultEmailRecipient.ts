import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { useFindOneRecord } from '@/object-record/hooks/useFindOneRecord';
import { CoreObjectNameSingular } from 'twenty-shared/types';

type UseResolveDefaultEmailRecipientParams = {
  objectNameSingular: string | null | undefined;
  recordId: string | null | undefined;
};

export const useResolveDefaultEmailRecipient = ({
  objectNameSingular,
  recordId,
}: UseResolveDefaultEmailRecipientParams) => {
  const isPerson = objectNameSingular === CoreObjectNameSingular.Person;
  const isCompany = objectNameSingular === CoreObjectNameSingular.Company;
  const isRecordWithPointOfContact =
    objectNameSingular === CoreObjectNameSingular.Opportunity ||
    objectNameSingular === CoreObjectNameSingular.Service;

  const skipPerson = !isPerson || !recordId;
  const skipCompanyPeople = !isCompany || !recordId;
  const skipPointOfContact = !isRecordWithPointOfContact || !recordId;

  const { record: personRecord, loading: personLoading } = useFindOneRecord({
    objectNameSingular: CoreObjectNameSingular.Person,
    objectRecordId: recordId ?? '',
    recordGqlFields: { id: true, emails: { primaryEmail: true } },
    skip: skipPerson,
  });

  const { records: companyPeople, loading: companyPeopleLoading } =
    useFindManyRecords({
      objectNameSingular: CoreObjectNameSingular.Person,
      filter: { companyId: { eq: recordId ?? '' } },
      recordGqlFields: { id: true, emails: { primaryEmail: true } },
      limit: 1,
      skip: skipCompanyPeople,
    });

  const {
    record: recordWithPointOfContact,
    loading: recordWithPointOfContactLoading,
  } = useFindOneRecord({
    objectNameSingular: skipPointOfContact
      ? CoreObjectNameSingular.Opportunity
      : objectNameSingular,
    objectRecordId: recordId ?? '',
    recordGqlFields: {
      id: true,
      pointOfContact: { id: true, emails: { primaryEmail: true } },
    },
    skip: skipPointOfContact,
  });

  const defaultTo = isPerson
    ? (personRecord?.emails?.primaryEmail ?? '')
    : isCompany
      ? (companyPeople[0]?.emails?.primaryEmail ?? '')
      : isRecordWithPointOfContact
        ? (recordWithPointOfContact?.pointOfContact?.emails?.primaryEmail ?? '')
        : '';

  const defaultRecipientPersonId = isPerson
    ? personRecord?.id
    : isCompany
      ? companyPeople[0]?.id
      : isRecordWithPointOfContact
        ? recordWithPointOfContact?.pointOfContact?.id
        : undefined;

  const loading =
    (isPerson && personLoading) ||
    (isCompany && companyPeopleLoading) ||
    (isRecordWithPointOfContact && recordWithPointOfContactLoading);

  return { defaultRecipientPersonId, defaultTo, loading };
};
