import { ROBOOST_TEAM_FILTER_VALUE_PREFIX } from 'twenty-shared/utils';

// A people filter value "team:<id>" stands for whoever is in that team when the query runs
export const toRoboostTeamFilterValue = (teamId: string) =>
  `${ROBOOST_TEAM_FILTER_VALUE_PREFIX}${teamId}`;

export const getRoboostTeamIdFromFilterValue = (value: string) =>
  value.startsWith(ROBOOST_TEAM_FILTER_VALUE_PREFIX)
    ? value.slice(ROBOOST_TEAM_FILTER_VALUE_PREFIX.length)
    : null;

// The server expands a team id in a member filter to the team's current members
export const toRoboostMemberFilterIds = (values: string[]): string[] => [
  ...new Set(
    values.map((value) => getRoboostTeamIdFromFilterValue(value) ?? value),
  ),
];
