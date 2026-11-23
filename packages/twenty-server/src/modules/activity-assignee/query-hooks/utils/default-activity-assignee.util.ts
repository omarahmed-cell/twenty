import { type RecordInput } from 'src/engine/core-modules/actor/services/actor-from-auth-context.service';
import { isUserAuthContext } from 'src/engine/core-modules/auth/guards/is-user-auth-context.guard';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';

const ASSIGNEE_FIELD_BY_ACTIVITY_OBJECT: Record<string, string> = {
  task: 'assigneeId',
  note: 'assignedToId',
  call: 'assignedToId',
  communication: 'assignedToId',
  email: 'assignedToId',
  calendarEvent: 'assignedToId',
  meeting: 'hostId',
};

// A member creating an activity owns it unless they picked someone; API keys (imports) keep what they send
export const defaultActivityAssignee = ({
  authContext,
  objectName,
  records,
}: {
  authContext: WorkspaceAuthContext;
  objectName: string;
  records: RecordInput[];
}): RecordInput[] => {
  const assigneeField = ASSIGNEE_FIELD_BY_ACTIVITY_OBJECT[objectName];

  if (assigneeField === undefined || !isUserAuthContext(authContext)) {
    return records;
  }

  // Workflow steps can run as the member who started them, but follow the workflow assignee rule instead
  return records.map((record) =>
    assigneeField in record ||
    assigneeField.replace(/Id$/, '') in record ||
    (record.createdBy as { source?: string } | undefined)?.source === 'WORKFLOW'
      ? record
      : { ...record, [assigneeField]: authContext.workspaceMemberId },
  );
};
