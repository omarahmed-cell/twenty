// Turns on stage-date tracking for one SELECT field; each option maps to its entered/exited DATE_TIME fields
export type StageDateTrackingConfig = {
  objectNameSingular: string;
  stageFieldName: string;
  currentStageEnteredFieldName: string;
  fieldNamesByStage: Record<
    string,
    { enteredFieldName: string; exitedFieldName: string }
  >;
};
