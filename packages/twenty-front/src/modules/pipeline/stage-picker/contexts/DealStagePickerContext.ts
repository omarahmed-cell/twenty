import { createContext } from 'react';

// Forms that edit deals say which pipeline the stage belongs to; without it the full labelled list shows
export type DealStagePickerContextValue = {
  pipelineKey: string | null | undefined;
  disabledReason?: string;
};

export const DealStagePickerContext =
  createContext<DealStagePickerContextValue | null>(null);
