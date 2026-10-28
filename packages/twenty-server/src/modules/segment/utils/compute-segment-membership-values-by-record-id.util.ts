import { getSegmentMembershipOptionValue } from 'twenty-shared/utils';

export const computeSegmentMembershipValuesByRecordId = ({
  recordIds,
  members,
  activeSegmentIds,
}: {
  recordIds: string[];
  members: { recordId: string; segmentId: string }[];
  activeSegmentIds: Set<string>;
}): Map<string, string[]> => {
  const valuesByRecordId = new Map<string, string[]>(
    recordIds.map((recordId) => [recordId, []]),
  );

  for (const { recordId, segmentId } of members) {
    const values = valuesByRecordId.get(recordId);

    if (values === undefined || !activeSegmentIds.has(segmentId)) {
      continue;
    }

    const value = getSegmentMembershipOptionValue(segmentId);

    if (!values.includes(value)) {
      values.push(value);
    }
  }

  for (const values of valuesByRecordId.values()) {
    values.sort();
  }

  return valuesByRecordId;
};
