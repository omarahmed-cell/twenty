// Turns on stage-date tracking for one SELECT field; each option maps to its entered/exited DATE_TIME fields
export type StageDateTrackingConfig = {
  objectNameSingular: string;
  stageFieldName: string;
  currentStageEnteredFieldName: string;
  // Whole days in the current stage: 0 on entering a stage, empty once cleared; a daily recompute advances it
  daysInCurrentStageFieldName?: string;
  fieldNamesByStage: Record<
    string,
    { enteredFieldName: string; exitedFieldName: string }
  >;
};

export type StageDateUpdates = Record<string, string | number | null>;
