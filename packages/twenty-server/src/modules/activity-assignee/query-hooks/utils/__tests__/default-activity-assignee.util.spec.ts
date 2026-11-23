import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { defaultActivityAssignee } from 'src/modules/activity-assignee/query-hooks/utils/default-activity-assignee.util';

const userAuthContext = {
  type: 'user',
  workspace: { id: 'workspace-1' },
  workspaceMemberId: 'member-1',
  userWorkspaceId: 'user-workspace-1',
  user: { id: 'user-1' },
  workspaceMember: { id: 'member-1' },
} as unknown as WorkspaceAuthContext;

const apiKeyAuthContext = {
  type: 'apiKey',
  workspace: { id: 'workspace-1' },
  apiKey: { id: 'key-1' },
} as unknown as WorkspaceAuthContext;

describe('defaultActivityAssignee', () => {
  it('assigns a task to the member who creates it', () => {
    expect(
      defaultActivityAssignee({
        authContext: userAuthContext,
        objectName: 'task',
        records: [{ title: 'Call back' }],
      }),
    ).toEqual([{ title: 'Call back', assigneeId: 'member-1' }]);
  });

  it('uses assignedTo on other activities', () => {
    expect(
      defaultActivityAssignee({
        authContext: userAuthContext,
        objectName: 'note',
        records: [{ title: 'Met' }],
      }),
    ).toEqual([{ title: 'Met', assignedToId: 'member-1' }]);
  });

  it('keeps an assignee the member picked, including none', () => {
    expect(
      defaultActivityAssignee({
        authContext: userAuthContext,
        objectName: 'task',
        records: [{ assigneeId: null }, { assigneeId: 'member-2' }],
      }),
    ).toEqual([{ assigneeId: null }, { assigneeId: 'member-2' }]);
  });

  it('leaves imports and workflow steps alone', () => {
    expect(
      defaultActivityAssignee({
        authContext: apiKeyAuthContext,
        objectName: 'task',
        records: [{ title: 'Imported' }],
      }),
    ).toEqual([{ title: 'Imported' }]);
    expect(
      defaultActivityAssignee({
        authContext: userAuthContext,
        objectName: 'task',
        records: [{ createdBy: { source: 'WORKFLOW' } }],
      }),
    ).toEqual([{ createdBy: { source: 'WORKFLOW' } }]);
  });

  it('ignores objects that are not activities', () => {
    expect(
      defaultActivityAssignee({
        authContext: userAuthContext,
        objectName: 'company',
        records: [{ name: 'Acme' }],
      }),
    ).toEqual([{ name: 'Acme' }]);
  });
});
