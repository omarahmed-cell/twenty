import { createAtomState } from '@/ui/utilities/state/jotai/utils/createAtomState';

export type RoboostActivityType =
  | 'note'
  | 'call'
  | 'task'
  | 'meeting'
  | 'whatsapp'
  | 'linkedin'
  | 'sms';

export type RoboostActivityTarget = {
  objectNameSingular: string;
  recordId: string;
  label: string;
};

export type RoboostActivityComposer = {
  type: RoboostActivityType;
  targets: RoboostActivityTarget[];
};

export const roboostActivityComposerState =
  createAtomState<RoboostActivityComposer | null>({
    key: 'roboostActivityComposer',
    defaultValue: null,
  });
