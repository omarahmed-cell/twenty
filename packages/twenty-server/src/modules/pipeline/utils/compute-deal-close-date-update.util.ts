import { isClosedDealStageProbability, isDefined } from 'twenty-shared/utils';

// Entering a won or lost stage dates the close; reopening the deal clears it. Imports bring their own dates.
export const computeDealCloseDateUpdate = ({
  isImport,
  isCreate,
  previousStageProbability,
  nextStageProbability,
  hasStageChanged,
  currentCloseDate,
  today,
}: {
  isImport: boolean;
  isCreate: boolean;
  previousStageProbability: number | null | undefined;
  nextStageProbability: number | null | undefined;
  hasStageChanged: boolean;
  currentCloseDate: string | null | undefined;
  today: string;
}): { closeDate: string | null } | null => {
  if (isImport || (!isCreate && !hasStageChanged)) {
    return null;
  }

  const isNextClosed = isClosedDealStageProbability(nextStageProbability);

  if (isCreate) {
    return isNextClosed && !isDefined(currentCloseDate)
      ? { closeDate: today }
      : null;
  }

  const isPreviousClosed = isClosedDealStageProbability(
    previousStageProbability,
  );

  if (isNextClosed) {
    return { closeDate: today };
  }

  if (!isNextClosed && isPreviousClosed) {
    return isDefined(currentCloseDate) ? { closeDate: null } : null;
  }

  return null;
};
