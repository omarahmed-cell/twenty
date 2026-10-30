export const computeSegmentPullDiff = ({
  associatedRecordIds,
  currentRecordIds,
}: {
  associatedRecordIds: string[];
  currentRecordIds: string[];
}): { recordIdsToAdd: string[]; recordIdsToRemove: string[] } => {
  const associated = new Set(associatedRecordIds);
  const current = new Set(currentRecordIds);

  return {
    recordIdsToAdd: [...associated].filter(
      (recordId) => !current.has(recordId),
    ),
    recordIdsToRemove: [...current].filter(
      (recordId) => !associated.has(recordId),
    ),
  };
};
