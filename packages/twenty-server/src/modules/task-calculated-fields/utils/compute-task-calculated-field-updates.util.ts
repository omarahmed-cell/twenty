import { isNonEmptyString } from '@sniptt/guards';
import { isDefined } from 'twenty-shared/utils';

const DONE_STATUS = 'DONE';

export type TaskCalculatedFieldUpdates = {
  completedAt?: string | null;
  assignedById?: string | null;
  isOverdue?: boolean;
};

export const isTaskOverdue = ({
  dueAt,
  status,
  now,
}: {
  dueAt: unknown;
  status: unknown;
  now: Date;
}) => {
  // Database events carry dates as Date objects, API payloads as strings
  const dueTime =
    dueAt instanceof Date
      ? dueAt.getTime()
      : isNonEmptyString(dueAt)
        ? new Date(dueAt).getTime()
        : Number.NaN;

  return dueTime < now.getTime() && status !== DONE_STATUS;
};

// Imports bring their own Completed at and Task assigned by through the loader
export const computeTaskCalculatedFieldUpdates = ({
  before,
  after,
  isUpdate,
  isImport,
  actorWorkspaceMemberId,
  now,
}: {
  before: Record<string, unknown> | undefined;
  after: Record<string, unknown> | undefined;
  isUpdate: boolean;
  isImport: boolean;
  actorWorkspaceMemberId: string | undefined;
  now: Date;
}): TaskCalculatedFieldUpdates => {
  if (!isDefined(after)) {
    return {};
  }

  const updates: TaskCalculatedFieldUpdates = {};

  if (!isImport) {
    const wasDone = isUpdate && before?.status === DONE_STATUS;
    const isDone = after.status === DONE_STATUS;

    if (isDone && !wasDone) {
      updates.completedAt = now.toISOString();
    } else if (!isDone && isDefined(after.completedAt)) {
      updates.completedAt = null;
    }

    const previousAssigneeId = isUpdate ? before?.assigneeId : undefined;
    // A write that sets Task assigned by itself (e.g. a loader) keeps its value
    const isAssignedBySetByWrite = isUpdate
      ? after.assignedById !== before?.assignedById
      : isNonEmptyString(after.assignedById);

    if (
      isNonEmptyString(after.assigneeId) &&
      after.assigneeId !== previousAssigneeId &&
      !isAssignedBySetByWrite
    ) {
      updates.assignedById = actorWorkspaceMemberId ?? null;
    }
  }

  const isOverdue = isTaskOverdue({
    dueAt: after.dueAt,
    status: after.status,
    now,
  });

  if (isOverdue !== after.isOverdue) {
    updates.isOverdue = isOverdue;
  }

  return updates;
};
