import { DEFAULT_ROBOOST_PROPERTY_HISTORY_LIMITS } from '@/roboost-app/history/constants/DefaultRoboostPropertyHistoryLimits';
import { ROBOOST_PROPERTY_HISTORY_LIMITS_KEY } from '@/roboost-app/history/constants/RoboostPropertyHistoryLimitsKey';
import { type RoboostPropertyHistoryLimits } from '@/roboost-app/history/types/RoboostPropertyHistoryLimits';
import { useRoboostUserVars } from '@/roboost-app/hooks/useRoboostUserVars';
import { isNumber } from '@sniptt/guards';

// Workspace-wide, read by the server when it trims field history
export const useRoboostPropertyHistoryLimits = () => {
  const { getWorkspaceDefault, setWorkspaceDefault } = useRoboostUserVars();
  const saved = getWorkspaceDefault<Partial<RoboostPropertyHistoryLimits>>(
    ROBOOST_PROPERTY_HISTORY_LIMITS_KEY,
  );

  const limits: RoboostPropertyHistoryLimits = {
    contacts: isNumber(saved?.contacts)
      ? saved.contacts
      : DEFAULT_ROBOOST_PROPERTY_HISTORY_LIMITS.contacts,
    others: isNumber(saved?.others)
      ? saved.others
      : DEFAULT_ROBOOST_PROPERTY_HISTORY_LIMITS.others,
  };

  const getLimit = (objectNameSingular: string) =>
    objectNameSingular === 'person' ? limits.contacts : limits.others;

  const saveLimits = (nextLimits: RoboostPropertyHistoryLimits) =>
    setWorkspaceDefault(ROBOOST_PROPERTY_HISTORY_LIMITS_KEY, nextLimits);

  return { limits, getLimit, saveLimits };
};
