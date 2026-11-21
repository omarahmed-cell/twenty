import {
  type RoboostCreatePanelRequest,
  roboostCreatePanelState,
} from '@/roboost-app/states/roboostCreatePanelState';
import { useSetAtomState } from '@/ui/utilities/state/jotai/hooks/useSetAtomState';

export const useOpenRoboostCreatePanel = () => {
  const setRoboostCreatePanel = useSetAtomState(roboostCreatePanelState);

  return (request: RoboostCreatePanelRequest) => setRoboostCreatePanel(request);
};
