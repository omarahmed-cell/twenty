import { computeTaskCalculatedFieldUpdates } from 'src/modules/task-calculated-fields/utils/compute-task-calculated-field-updates.util';

const NOW = new Date('2026-11-18T12:00:00.000Z');
const PAST = '2026-11-17T12:00:00.000Z';
const FUTURE = '2026-11-19T12:00:00.000Z';

const compute = (
  overrides: Partial<Parameters<typeof computeTaskCalculatedFieldUpdates>[0]>,
) =>
  computeTaskCalculatedFieldUpdates({
    before: undefined,
    after: undefined,
    isUpdate: true,
    isImport: false,
    actorWorkspaceMemberId: 'member-actor',
    now: NOW,
    ...overrides,
  });

describe('computeTaskCalculatedFieldUpdates', () => {
  it('stamps Completed at when the status moves to Done', () => {
    expect(
      compute({
        before: { status: 'IN_PROGRESS' },
        after: { status: 'DONE', isOverdue: false },
      }),
    ).toEqual({ completedAt: NOW.toISOString() });
  });

  it('keeps Completed at when a done task is edited', () => {
    expect(
      compute({
        before: { status: 'DONE', title: 'a' },
        after: {
          status: 'DONE',
          title: 'b',
          completedAt: PAST,
          isOverdue: false,
        },
      }),
    ).toEqual({});
  });

  it('clears Completed at when the task leaves Done', () => {
    expect(
      compute({
        before: { status: 'DONE' },
        after: { status: 'TODO', completedAt: PAST, isOverdue: false },
      }),
    ).toEqual({ completedAt: null });
  });

  it('stamps Completed at on a task created as Done', () => {
    expect(
      compute({ isUpdate: false, after: { status: 'DONE', isOverdue: false } }),
    ).toEqual({ completedAt: NOW.toISOString() });
  });

  it('stamps Task assigned by with the actor when the assignee changes, self-assignment included', () => {
    expect(
      compute({
        before: { assigneeId: 'member-a' },
        after: { assigneeId: 'member-actor', isOverdue: false },
      }),
    ).toEqual({ assignedById: 'member-actor' });
  });

  it('empties Task assigned by when no member made the change', () => {
    expect(
      compute({
        actorWorkspaceMemberId: undefined,
        before: { assigneeId: null },
        after: { assigneeId: 'member-a', isOverdue: false },
      }),
    ).toEqual({ assignedById: null });
  });

  it('leaves Task assigned by alone when the assignee is cleared or unchanged', () => {
    expect(
      compute({
        before: { assigneeId: 'member-a' },
        after: { assigneeId: null, isOverdue: false },
      }),
    ).toEqual({});
    expect(
      compute({
        before: { assigneeId: 'member-a', title: 'a' },
        after: { assigneeId: 'member-a', title: 'b', isOverdue: false },
      }),
    ).toEqual({});
  });

  it('keeps a Task assigned by that the same write sets', () => {
    expect(
      compute({
        actorWorkspaceMemberId: undefined,
        isUpdate: false,
        after: {
          assigneeId: 'member-a',
          assignedById: 'member-b',
          isOverdue: false,
        },
      }),
    ).toEqual({});
    expect(
      compute({
        before: { assigneeId: null, assignedById: null },
        after: {
          assigneeId: 'member-a',
          assignedById: 'member-b',
          isOverdue: false,
        },
      }),
    ).toEqual({});
  });

  it('skips the stamps on imports but still computes Is Overdue', () => {
    expect(
      compute({
        isImport: true,
        isUpdate: false,
        after: {
          status: 'DONE',
          assigneeId: 'member-a',
          dueAt: PAST,
          isOverdue: true,
        },
      }),
    ).toEqual({ isOverdue: false });
  });

  it('marks a past-due open task overdue and clears it once rescheduled or done', () => {
    expect(
      compute({
        before: { dueAt: FUTURE },
        after: { status: 'TODO', dueAt: PAST, isOverdue: false },
      }),
    ).toEqual({ isOverdue: true });
    expect(
      compute({
        before: { dueAt: PAST },
        after: { status: 'TODO', dueAt: FUTURE, isOverdue: true },
      }),
    ).toEqual({ isOverdue: false });
    expect(
      compute({
        before: { status: 'TODO' },
        after: { status: 'DONE', dueAt: PAST, isOverdue: true },
      }),
    ).toEqual({ completedAt: NOW.toISOString(), isOverdue: false });
  });

  it('treats a task without a due date as not overdue', () => {
    expect(
      compute({ after: { status: null, dueAt: null, isOverdue: true } }),
    ).toEqual({ isOverdue: false });
  });
});
