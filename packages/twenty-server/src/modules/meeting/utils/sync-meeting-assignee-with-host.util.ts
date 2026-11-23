import { type RecordInput } from 'src/engine/core-modules/actor/services/actor-from-auth-context.service';

// "Assigned to" always mirrors the host: it follows host changes and cannot be set on its own
export const syncMeetingAssigneeWithHost = (
  record: RecordInput,
): RecordInput => {
  const {
    assignedToId: _ignored,
    assignedTo: _ignoredRelation,
    ...rest
  } = record as RecordInput & { assignedToId?: unknown; assignedTo?: unknown };

  return 'hostId' in record
    ? { ...rest, assignedToId: (record as { hostId?: unknown }).hostId ?? null }
    : rest;
};
