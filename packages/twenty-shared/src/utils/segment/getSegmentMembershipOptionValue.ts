// Keyed by segment id so renaming a segment only changes the option label
export const getSegmentMembershipOptionValue = (segmentId: string) =>
  `SEGMENT_${segmentId.replace(/-/g, '').toUpperCase()}`;
