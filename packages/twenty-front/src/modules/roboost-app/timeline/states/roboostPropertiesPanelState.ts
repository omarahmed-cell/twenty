import { createAtomState } from '@/ui/utilities/state/jotai/utils/createAtomState';

export type RoboostPropertiesPanelTarget = {
  objectNameSingular: string;
  recordId: string;
};

export const roboostPropertiesPanelState =
  createAtomState<RoboostPropertiesPanelTarget | null>({
    key: 'roboostPropertiesPanel',
    defaultValue: null,
  });
