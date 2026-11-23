const getDiffKeys = (properties: unknown) =>
  Object.keys((properties as { diff?: object } | null)?.diff ?? {});

// A second change to the same field gets its own row, so field history keeps every value
export const doTimelineActivityDiffsOverlap = (
  existingProperties: unknown,
  newProperties: unknown,
): boolean => {
  const existingKeys = new Set(getDiffKeys(existingProperties));

  return getDiffKeys(newProperties).some((key) => existingKeys.has(key));
};
