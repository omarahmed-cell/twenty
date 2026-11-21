import { currentUserState } from '@/auth/states/currentUserState';
import { ROBOOST_USER_VAR_KEYS } from '@/roboost-app/constants/RoboostUserVarKeys';
import { roboostModeState } from '@/roboost-app/states/roboostModeState';
import { roboostNavCollapsedState } from '@/roboost-app/states/roboostNavCollapsedState';
import { type RoboostMode } from '@/roboost-ui/types/RoboostMode';
import { useAtomState } from '@/ui/utilities/state/jotai/hooks/useAtomState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { useEffect } from 'react';

const ROBOOST_MODES: RoboostMode[] = ['roboost', 'sira', 'light'];

// Follows the member's saved mode and nav state and puts it on <html>, so menus and dialogs portalled to <body> match
export const RoboostPreferencesEffect = () => {
  const currentUser = useAtomStateValue(currentUserState);
  const [roboostMode, setRoboostMode] = useAtomState(roboostModeState);
  const [roboostNavCollapsed, setRoboostNavCollapsed] = useAtomState(
    roboostNavCollapsedState,
  );

  const userVars = currentUser?.userVars as Record<string, unknown> | null;
  const savedMode = userVars?.[ROBOOST_USER_VAR_KEYS.mode];
  const savedNavCollapsed = userVars?.[ROBOOST_USER_VAR_KEYS.navCollapsed];

  useEffect(() => {
    if (
      typeof savedNavCollapsed === 'boolean' &&
      savedNavCollapsed !== roboostNavCollapsed
    ) {
      setRoboostNavCollapsed(savedNavCollapsed);
    }
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [savedNavCollapsed]);

  useEffect(() => {
    if (
      ROBOOST_MODES.includes(savedMode as RoboostMode) &&
      savedMode !== roboostMode
    ) {
      setRoboostMode(savedMode as RoboostMode);
    }
    // Only a change of the saved value should override the local copy
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [savedMode]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', roboostMode);

    return () => document.documentElement.removeAttribute('data-theme');
  }, [roboostMode]);

  return null;
};
