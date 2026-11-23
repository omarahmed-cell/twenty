import { useRoboostUserVars } from '@/roboost-app/hooks/useRoboostUserVars';
import {
  DEFAULT_WORKING_DAYS_CONFIG,
  isDefined,
  type WorkingDaysConfig,
} from 'twenty-shared/utils';

export const ROBOOST_WORKING_DAYS_KEY = 'workingDays';

// Workspace-wide work week, saved as an admin default every member reads
export const useRoboostWorkingDays = () => {
  const { getWorkspaceDefault, setWorkspaceDefault } = useRoboostUserVars();
  const saved = getWorkspaceDefault<WorkingDaysConfig>(
    ROBOOST_WORKING_DAYS_KEY,
  );

  const workingDays: WorkingDaysConfig =
    isDefined(saved) && Array.isArray(saved.days)
      ? {
          days: saved.days,
          startTime: saved.startTime ?? DEFAULT_WORKING_DAYS_CONFIG.startTime,
        }
      : DEFAULT_WORKING_DAYS_CONFIG;

  const saveWorkingDays = (config: WorkingDaysConfig) =>
    setWorkspaceDefault(ROBOOST_WORKING_DAYS_KEY, config);

  return { workingDays, saveWorkingDays };
};
