import { isDefined } from 'twenty-shared/utils';

import { type StageDateTrackingConfig } from 'src/modules/stage-date-tracking/types/stage-date-tracking-config.type';

// Moving A -> B stamps B entered, A exited and the current-stage date; clearing only stamps A exited
export const computeStageDateUpdates = ({
  config,
  previousStage,
  nextStage,
  changedAt,
}: {
  config: StageDateTrackingConfig;
  previousStage: string | null | undefined;
  nextStage: string | null | undefined;
  changedAt: string;
}): Record<string, string> => {
  const normalizedPreviousStage = previousStage ?? null;
  const normalizedNextStage = nextStage ?? null;

  if (normalizedPreviousStage === normalizedNextStage) {
    return {};
  }

  const updates: Record<string, string> = {};

  const previousStageFieldNames = isDefined(normalizedPreviousStage)
    ? config.fieldNamesByStage[normalizedPreviousStage]
    : undefined;

  if (isDefined(previousStageFieldNames)) {
    updates[previousStageFieldNames.exitedFieldName] = changedAt;
  }

  const nextStageFieldNames = isDefined(normalizedNextStage)
    ? config.fieldNamesByStage[normalizedNextStage]
    : undefined;

  if (isDefined(nextStageFieldNames)) {
    updates[nextStageFieldNames.enteredFieldName] = changedAt;
  }

  if (isDefined(normalizedNextStage)) {
    updates[config.currentStageEnteredFieldName] = changedAt;
  }

  return updates;
};
