import { ROBOOST_MY_ACCESS } from '@/roboost-app/users-and-teams/graphql/roboostUsersQueries';
import { useQuery } from '@apollo/client/react';
import {
  type RoboostObjectPermissions,
  type RoboostUserPermissions,
} from 'twenty-shared/types';
import { normalizeRoboostPermissions } from 'twenty-shared/utils';

type RoboostMyAccessQuery = {
  roboostMyAccess: {
    workspaceMemberId: string | null;
    isAdmin: boolean;
    permissions: Partial<RoboostUserPermissions>;
    teamIds: string[];
  };
};

export type RoboostAccess = {
  isLoaded: boolean;
  isAdmin: boolean;
  workspaceMemberId: string | null;
  teamIds: string[];
  permissions: RoboostUserPermissions;
  hasToggle: (toggleKey: string) => boolean;
  getObjectPermissions: (
    objectNameSingular: string,
  ) => RoboostObjectPermissions | undefined;
  canCreate: (objectNameSingular: string) => boolean;
  canSeeUserTable: boolean;
};

// The signed-in user's own access, used to hide what they can't do; the server enforces the same rules
export const useRoboostAccess = (): RoboostAccess => {
  const { data } = useQuery<RoboostMyAccessQuery>(ROBOOST_MY_ACCESS, {
    fetchPolicy: 'cache-first',
  });
  const access = data?.roboostMyAccess;
  const isLoaded = access !== undefined;
  const isAdmin = access?.isAdmin === true;
  const permissions = normalizeRoboostPermissions(access?.permissions);

  // Before the answer arrives everything is allowed, so admins never see controls flicker away
  const hasToggle = (toggleKey: string) =>
    !isLoaded || isAdmin || permissions.toggles[toggleKey] === true;

  const getObjectPermissions = (objectNameSingular: string) =>
    !isLoaded || isAdmin ? undefined : permissions.objects[objectNameSingular];

  const canCreate = (objectNameSingular: string) => {
    const objectPermissions = getObjectPermissions(objectNameSingular);

    return objectPermissions === undefined
      ? true
      : objectPermissions.enabled && objectPermissions.create === true;
  };

  return {
    isLoaded,
    isAdmin,
    workspaceMemberId: access?.workspaceMemberId ?? null,
    teamIds: access?.teamIds ?? [],
    permissions,
    hasToggle,
    getObjectPermissions,
    canCreate,
    canSeeUserTable:
      isLoaded && (isAdmin || permissions.toggles.userTableAccess === true),
  };
};
