import { createAtomState } from '@/ui/utilities/state/jotai/utils/createAtomState';

export type RoboostCreatePanelRequest = {
  objectNameSingular: string;
  // Values set before the form opens, for example the company when adding a contact from its record
  presetValues?: Record<string, unknown>;
  // Activities created from a record are linked to it through their junction object
  linkToRecord?: { objectNameSingular: string; recordId: string };
  // Prefilled, editable form values (Clone)
  initialValues?: Record<string, unknown>;
  initialRelatedRecords?: Record<string, { id: string; label: string } | null>;
};

export const roboostCreatePanelState =
  createAtomState<RoboostCreatePanelRequest | null>({
    key: 'roboostCreatePanel',
    defaultValue: null,
  });
