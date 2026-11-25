import { ROBOOST_TEAMS } from '@/roboost-app/users-and-teams/graphql/roboostUsersQueries';
import { type RoboostTeam } from '@/roboost-app/users-and-teams/types/RoboostUsers';
import { useQuery } from '@apollo/client/react';

// Teams offered at the top of every people picker; a team id in a member filter means its current members
export const useRoboostTeamOptions = (isWorkspaceMemberPicker: boolean) => {
  const { data } = useQuery<{ roboostTeams: RoboostTeam[] }>(ROBOOST_TEAMS, {
    fetchPolicy: 'cache-and-network',
    skip: !isWorkspaceMemberPicker,
  });

  return isWorkspaceMemberPicker ? (data?.roboostTeams ?? []) : [];
};
