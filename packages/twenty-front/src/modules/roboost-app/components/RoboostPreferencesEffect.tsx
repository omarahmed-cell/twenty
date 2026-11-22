import { currentUserState } from '@/auth/states/currentUserState';
import { ROBOOST_USER_VAR_KEYS } from '@/roboost-app/constants/RoboostUserVarKeys';
import { roboostModeState } from '@/roboost-app/states/roboostModeState';
import { roboostNavCollapsedState } from '@/roboost-app/states/roboostNavCollapsedState';
import { ROBOOST_MODES } from '@/roboost-ui/constants/RoboostModes';
import { type RoboostMode } from '@/roboost-ui/types/RoboostMode';
import { getRoboostModeAttributes } from '@/roboost-ui/utils/getRoboostModeAttributes';
import { useAtomState } from '@/ui/utilities/state/jotai/hooks/useAtomState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { useEffect } from 'react';

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
    const { theme, scheme } = getRoboostModeAttributes(roboostMode);
    const root = document.documentElement;

    root.setAttribute('data-theme', theme);
    root.setAttribute('data-scheme', scheme);

    return () => {
      root.removeAttribute('data-theme');
      root.removeAttribute('data-scheme');
    };
  }, [roboostMode]);

  return null;
};
