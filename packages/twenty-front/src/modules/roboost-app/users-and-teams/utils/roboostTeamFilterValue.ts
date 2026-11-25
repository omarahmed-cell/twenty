import { type RoboostTeam } from '@/roboost-app/users-and-teams/types/RoboostUsers';
import { isDefined } from 'twenty-shared/utils';

const TEAM_VALUE_PREFIX = 'team:';

// A people filter value "team:<id>" stands for whoever is in that team when the list loads
export const toRoboostTeamFilterValue = (teamId: string) =>
  `${TEAM_VALUE_PREFIX}${teamId}`;

export const getRoboostTeamIdFromFilterValue = (value: string) =>
  value.startsWith(TEAM_VALUE_PREFIX)
    ? value.slice(TEAM_VALUE_PREFIX.length)
    : null;

export const buildRoboostTeamMemberIdsByTeamId = (teams: RoboostTeam[]) =>
  Object.fromEntries(
    teams.map((team) => [
      team.id,
      team.members.map((member) => member.workspaceMemberId),
    ]),
  );

// An empty team still has to match nothing rather than drop the condition
const NO_MEMBER_ID = '00000000-0000-0000-0000-000000000000';

export const expandRoboostTeamFilterValues = (
  values: string[],
  teamMemberIdsByTeamId: Record<string, string[]>,
): string[] => {
  const expanded = values.flatMap((value) => {
    const teamId = getRoboostTeamIdFromFilterValue(value);

    return isDefined(teamId)
      ? (teamMemberIdsByTeamId[teamId] ?? [NO_MEMBER_ID])
      : [value];
  });
  const unique = [...new Set(expanded)];

  return unique.length > 0 ? unique : [NO_MEMBER_ID];
};
