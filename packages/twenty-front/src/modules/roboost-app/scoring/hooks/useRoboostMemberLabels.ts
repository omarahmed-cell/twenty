import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { getRoboostPersonName } from '@/roboost-app/utils/getRoboostPersonName';
import { CoreObjectNameSingular } from 'twenty-shared/types';

type MemberRecord = {
  id: string;
  name: { firstName: string; lastName: string } | null;
  __typename: string;
};

// Owner values are member ids; this names them for the tester and the explanation
export const useRoboostMemberLabels = (): Record<string, string> => {
  const { records } = useFindManyRecords<MemberRecord>({
    objectNameSingular: CoreObjectNameSingular.WorkspaceMember,
    recordGqlFields: { id: true, name: true },
    limit: 300,
  });

  return Object.fromEntries(
    records.map((member) => [
      member.id,
      getRoboostPersonName(member.name ?? undefined) || member.id.slice(0, 8),
    ]),
  );
};
