import { randomBytes } from 'crypto';

import { isNonEmptyArray, isDefined } from 'twenty-shared/utils';
import { type ObjectLiteral } from 'typeorm';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// "eq"/"in" on a workspace member column also match the current members of any team id in the value
export const addRoboostTeamMembersToCondition = ({
  conditionParts,
  operator,
  value,
  fieldReference,
  schemaName,
}: {
  conditionParts: { sql: string; params: ObjectLiteral };
  operator: string;
  value: unknown;
  fieldReference: string;
  schemaName: string;
}): { sql: string; params: ObjectLiteral } => {
  const values =
    operator === 'in' && Array.isArray(value)
      ? value
      : operator === 'eq' && isDefined(value)
        ? [value]
        : [];
  const candidateTeamIds = values.filter(
    (candidate): candidate is string =>
      typeof candidate === 'string' && UUID_PATTERN.test(candidate),
  );

  if (!isNonEmptyArray(candidateTeamIds)) {
    return conditionParts;
  }

  const parameterName = `roboostTeamIds${randomBytes(5).toString('hex')}`;

  return {
    sql: `(${conditionParts.sql} OR ${fieldReference} IN (SELECT "roboostTeamMembership"."workspaceMemberId" FROM "${schemaName}"."teamMembership" "roboostTeamMembership" WHERE "roboostTeamMembership"."teamId" = ANY(CAST(:${parameterName} AS uuid[])) AND "roboostTeamMembership"."deletedAt" IS NULL))`,
    params: { ...conditionParts.params, [parameterName]: candidateTeamIds },
  };
};
