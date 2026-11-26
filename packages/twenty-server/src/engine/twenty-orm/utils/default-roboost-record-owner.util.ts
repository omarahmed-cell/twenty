import { ROBOOST_OWNERSHIP_FIELDS } from 'twenty-shared/constants';
import { type ObjectRecord } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

// Like HubSpot, a restricted member's new record is theirs unless they picked an owner; otherwise they could not read it back
export const defaultRoboostRecordOwner = <
  TRecord extends Partial<ObjectRecord>,
>({
  records,
  objectNameSingular,
  workspaceMemberId,
}: {
  records: TRecord[];
  objectNameSingular: string;
  workspaceMemberId: string;
}): TRecord[] => {
  const ownershipColumns = (
    ROBOOST_OWNERSHIP_FIELDS[objectNameSingular] ?? []
  ).map(({ joinColumnName }) => joinColumnName);

  if (ownershipColumns.length === 0) {
    return records;
  }

  return records.map((record) =>
    ownershipColumns.some((columnName) => isDefined(record[columnName]))
      ? record
      : { ...record, [ownershipColumns[0]]: workspaceMemberId },
  );
};
