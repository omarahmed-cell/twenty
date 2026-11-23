import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { CoreObjectNameSingular } from 'twenty-shared/types';

export type RoboostEmailContact = { objectNameSingular: string; id: string };

type PersonRecord = {
  id: string;
  emails?: { primaryEmail?: string | null } | null;
  __typename: string;
};
type MemberRecord = {
  id: string;
  userEmail?: string | null;
  __typename: string;
};

// One lookup for every address shown in the timeline, so each card can link names to their records
export const useRoboostEmailContacts = (addresses: string[]) => {
  const uniqueAddresses = [...new Set(addresses)].sort();

  const { records: people } = useFindManyRecords<PersonRecord>({
    objectNameSingular: CoreObjectNameSingular.Person,
    filter: { emails: { primaryEmail: { in: uniqueAddresses } } },
    recordGqlFields: { id: true, emails: true },
    limit: 200,
    skip: uniqueAddresses.length === 0,
  });
  const { records: members } = useFindManyRecords<MemberRecord>({
    objectNameSingular: CoreObjectNameSingular.WorkspaceMember,
    filter: { userEmail: { in: uniqueAddresses } },
    recordGqlFields: { id: true, userEmail: true },
    limit: 200,
    skip: uniqueAddresses.length === 0,
  });

  const contactByEmail = new Map<string, RoboostEmailContact>();

  for (const member of members) {
    if (member.userEmail) {
      contactByEmail.set(member.userEmail.toLowerCase(), {
        objectNameSingular: CoreObjectNameSingular.WorkspaceMember,
        id: member.id,
      });
    }
  }
  for (const person of people) {
    const email = person.emails?.primaryEmail;

    if (email) {
      contactByEmail.set(email.toLowerCase(), {
        objectNameSingular: CoreObjectNameSingular.Person,
        id: person.id,
      });
    }
  }

  return contactByEmail;
};
