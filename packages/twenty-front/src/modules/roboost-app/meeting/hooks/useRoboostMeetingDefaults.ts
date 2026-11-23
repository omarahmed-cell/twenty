import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { type RoboostActivityTarget } from '@/roboost-app/activity/states/roboostActivityComposerState';
import { type RoboostMeetingAttendeeDraft } from '@/roboost-app/meeting/components/RoboostMeetingAttendeesPicker';
import { isNonEmptyString } from '@sniptt/guards';
import { isDefined } from 'twenty-shared/utils';

type NamedRecord = { id: string; name?: unknown };
type PersonRecord = NamedRecord & {
  companyId?: string | null;
  emails?: { primaryEmail?: string | null } | null;
};
type OpportunityRecord = NamedRecord & {
  companyId?: string | null;
  pointOfContactId?: string | null;
};

const personName = (record: PersonRecord | undefined) => {
  const name = record?.name as
    | { firstName?: string | null; lastName?: string | null }
    | undefined;

  return [name?.firstName, name?.lastName].filter(isNonEmptyString).join(' ');
};

const plainName = (record: NamedRecord | undefined) =>
  typeof record?.name === 'string' ? record.name : '';

// The pop-up opens with the record's contact invited and the same links an email would get:
// the record, the contact's company and the company's open deals
export const useRoboostMeetingDefaults = (
  contextTarget: RoboostActivityTarget,
) => {
  const { objectNameSingular, recordId } = contextTarget;

  const { records: contextPeople, loading: isLoadingPerson } =
    useFindManyRecords<PersonRecord>({
      objectNameSingular: 'person',
      filter: { id: { eq: recordId } },
      recordGqlFields: { id: true, name: true, companyId: true, emails: true },
      skip: objectNameSingular !== 'person',
    });
  const { records: contextOpportunities, loading: isLoadingOpportunity } =
    useFindManyRecords<OpportunityRecord>({
      objectNameSingular: 'opportunity',
      filter: { id: { eq: recordId } },
      recordGqlFields: {
        id: true,
        name: true,
        companyId: true,
        pointOfContactId: true,
      },
      skip: objectNameSingular !== 'opportunity',
    });

  const contextPerson = contextPeople[0];
  const contextOpportunity = contextOpportunities[0];
  const companyId =
    objectNameSingular === 'company'
      ? recordId
      : (contextPerson?.companyId ?? contextOpportunity?.companyId ?? null);

  const { records: companies, loading: isLoadingCompany } =
    useFindManyRecords<NamedRecord>({
      objectNameSingular: 'company',
      filter: { id: { eq: companyId ?? '' } },
      recordGqlFields: { id: true, name: true },
      skip: !isDefined(companyId),
    });
  const { records: openDeals, loading: isLoadingDeals } =
    useFindManyRecords<NamedRecord>({
      objectNameSingular: 'opportunity',
      filter: {
        and: [
          { companyId: { eq: companyId ?? '' } },
          { isClosed: { eq: false } },
        ],
      },
      recordGqlFields: { id: true, name: true },
      limit: 10,
      skip: !isDefined(companyId) || objectNameSingular === 'opportunity',
    });

  // Opened from a company or deal: its primary contact is the deal's point of contact, else the company's first contact
  const primaryContactFilter = isDefined(contextOpportunity?.pointOfContactId)
    ? { id: { eq: contextOpportunity.pointOfContactId } }
    : { companyId: { eq: companyId ?? '' } };
  const { records: primaryContacts, loading: isLoadingContact } =
    useFindManyRecords<PersonRecord>({
      objectNameSingular: 'person',
      filter: primaryContactFilter,
      recordGqlFields: { id: true, name: true, companyId: true, emails: true },
      orderBy: [{ position: 'AscNullsLast' }],
      limit: 1,
      skip:
        objectNameSingular === 'person' ||
        (!isDefined(companyId) &&
          !isDefined(contextOpportunity?.pointOfContactId)),
    });

  const isLoading =
    isLoadingPerson ||
    isLoadingOpportunity ||
    isLoadingCompany ||
    isLoadingDeals ||
    isLoadingContact;

  const company = companies[0];
  const contact = contextPerson ?? primaryContacts[0];
  const contactEmail = contact?.emails?.primaryEmail;

  const attendees: RoboostMeetingAttendeeDraft[] =
    isDefined(contact) && isNonEmptyString(contactEmail)
      ? [
          {
            email: contactEmail,
            displayName: personName(contact) || null,
            personId: contact.id,
          },
        ]
      : [];

  const targets: RoboostActivityTarget[] = [
    contextTarget,
    ...(isDefined(company) && company.id !== recordId
      ? [
          {
            objectNameSingular: 'company',
            recordId: company.id,
            label: plainName(company),
          },
        ]
      : []),
    ...(isDefined(contact) && contact.id !== recordId
      ? [
          {
            objectNameSingular: 'person',
            recordId: contact.id,
            label: personName(contact),
          },
        ]
      : []),
    ...openDeals
      .filter((deal) => deal.id !== recordId)
      .map((deal) => ({
        objectNameSingular: 'opportunity',
        recordId: deal.id,
        label: plainName(deal),
      })),
  ];

  const companyName = plainName(company);

  return {
    isLoading,
    title: isNonEmptyString(companyName) ? `${companyName} x Sira` : '',
    attendees,
    targets,
  };
};
