import { ROBOOST_USER_VAR_KEYS } from '@/roboost-app/constants/RoboostUserVarKeys';
import { useRoboostUserVars } from '@/roboost-app/hooks/useRoboostUserVars';
import { roboostModeState } from '@/roboost-app/states/roboostModeState';
import { type RoboostMode } from '@/roboost-ui/types/RoboostMode';
import { useAtomState } from '@/ui/utilities/state/jotai/hooks/useAtomState';

export const useRoboostMode = () => {
  const [roboostMode, setRoboostMode] = useAtomState(roboostModeState);
  const { setUserVar } = useRoboostUserVars();

  const changeMode = async (mode: RoboostMode) => {
    setRoboostMode(mode);
    await setUserVar(ROBOOST_USER_VAR_KEYS.mode, mode);
  };

  return { mode: roboostMode, changeMode };
};
