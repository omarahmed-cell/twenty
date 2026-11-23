import { createAtomState } from '@/ui/utilities/state/jotai/utils/createAtomState';

export type RoboostOpenCellEditor = {
  key: string;
  isDirty: boolean;
  attentionAt?: number;
};

export const roboostOpenCellEditorState =
  createAtomState<RoboostOpenCellEditor | null>({
    key: 'roboostOpenCellEditor',
    defaultValue: null,
  });
