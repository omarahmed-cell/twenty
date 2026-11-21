import { currentUserState } from '@/auth/states/currentUserState';
import { SET_ROBOOST_USER_VAR } from '@/roboost-app/graphql/setRoboostUserVar';
import { SET_ROBOOST_WORKSPACE_VAR } from '@/roboost-app/graphql/setRoboostWorkspaceVar';
import { useAtomState } from '@/ui/utilities/state/jotai/hooks/useAtomState';
import { useMutation } from '@apollo/client/react';
import { isDefined } from 'twenty-shared/utils';

// Member preferences saved server-side as user vars ("roboost.*"), admin defaults as "roboost.default.*"
export const useRoboostUserVars = () => {
  const [currentUser, setCurrentUser] = useAtomState(currentUserState);
  const [setRoboostUserVarMutation] = useMutation(SET_ROBOOST_USER_VAR);
  const [setRoboostWorkspaceVarMutation] = useMutation(
    SET_ROBOOST_WORKSPACE_VAR,
  );

  const userVars = (currentUser?.userVars ?? {}) as Record<string, unknown>;

  const updateLocalUserVar = (key: string, value: unknown) => {
    if (!isDefined(currentUser)) {
      return;
    }
    const nextUserVars = { ...userVars };

    if (isDefined(value)) {
      nextUserVars[key] = value;
    } else {
      delete nextUserVars[key];
    }
    setCurrentUser({ ...currentUser, userVars: nextUserVars });
  };

  const setUserVar = async (key: string, value: unknown) => {
    updateLocalUserVar(key, value);
    await setRoboostUserVarMutation({ variables: { key, value } });
  };

  const setWorkspaceDefault = async (key: string, value: unknown) => {
    const defaultKey = `roboost.default.${key.replace(/^roboost\./, '')}`;

    updateLocalUserVar(defaultKey, value);
    await setRoboostWorkspaceVarMutation({
      variables: { key: defaultKey, value },
    });
  };

  const getUserVar = <TValue>(key: string): TValue | undefined =>
    userVars[key] as TValue | undefined;

  const getWorkspaceDefault = <TValue>(key: string): TValue | undefined =>
    userVars[`roboost.default.${key.replace(/^roboost\./, '')}`] as
      | TValue
      | undefined;

  return { getUserVar, getWorkspaceDefault, setUserVar, setWorkspaceDefault };
};
