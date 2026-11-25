import { addRoboostTeamMembersToCondition } from 'src/engine/api/graphql/graphql-query-runner/graphql-query-parsers/utils/add-roboost-team-members-to-condition.util';

const TEAM_ID = '6cf5d876-2223-46e1-9c8d-edeae8c62a96';

describe('addRoboostTeamMembersToCondition', () => {
  const conditionParts = {
    sql: '"company"."accountOwnerId" IN (:...ids)',
    params: { ids: [TEAM_ID] },
  };

  it('also matches the current members of a team id', () => {
    const result = addRoboostTeamMembersToCondition({
      conditionParts,
      operator: 'in',
      value: [TEAM_ID],
      fieldReference: '"company"."accountOwnerId"',
      schemaName: 'workspace_test',
    });

    expect(result.sql).toContain('"workspace_test"."teamMembership"');
    expect(result.sql.startsWith(`(${conditionParts.sql} OR`)).toBe(true);
    expect(Object.values(result.params)).toContainEqual([TEAM_ID]);
  });

  it('leaves other operators unchanged', () => {
    expect(
      addRoboostTeamMembersToCondition({
        conditionParts,
        operator: 'is',
        value: 'NULL',
        fieldReference: '"company"."accountOwnerId"',
        schemaName: 'workspace_test',
      }),
    ).toBe(conditionParts);
  });
});
