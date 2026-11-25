export const ROBOOST_USERS_AND_TEAMS_PATH = '/settings/users-and-teams';

export const getRoboostUsersPath = () =>
  `${ROBOOST_USERS_AND_TEAMS_PATH}/users`;

export const getRoboostTeamsPath = () =>
  `${ROBOOST_USERS_AND_TEAMS_PATH}/teams`;

export const getRoboostEditPermissionsPath = (workspaceMemberId: string) =>
  `${ROBOOST_USERS_AND_TEAMS_PATH}/users/${workspaceMemberId}/permissions`;

export const getRoboostCompareAccessPath = (
  firstWorkspaceMemberId: string,
  secondWorkspaceMemberId: string,
) =>
  `${ROBOOST_USERS_AND_TEAMS_PATH}/compare/${firstWorkspaceMemberId}/${secondWorkspaceMemberId}`;
