import { FieldActorSource } from 'twenty-shared/types';

import { getTimelineActivityActorKey } from 'src/modules/timeline/utils/get-timeline-activity-actor-key.util';

describe('getTimelineActivityActorKey', () => {
  it('returns null when no actor was recorded', () => {
    expect(getTimelineActivityActorKey({ diff: {} })).toBeNull();
    expect(getTimelineActivityActorKey(null)).toBeNull();
  });

  it('tells two workflow runs apart', () => {
    const fromRun = (workflowRunId: string) =>
      getTimelineActivityActorKey({
        updatedBy: {
          source: FieldActorSource.WORKFLOW,
          workspaceMemberId: null,
          name: 'Workflow',
          context: { workflowRunId },
        },
      });

    expect(fromRun('run-1')).toBe(fromRun('run-1'));
    expect(fromRun('run-1')).not.toBe(fromRun('run-2'));
  });

  it('tells a member edit apart from an API write', () => {
    const member = getTimelineActivityActorKey({
      updatedBy: {
        source: FieldActorSource.MANUAL,
        workspaceMemberId: 'member-1',
        name: 'Menna',
        context: {},
      },
    });
    const api = getTimelineActivityActorKey({
      updatedBy: {
        source: FieldActorSource.API,
        workspaceMemberId: null,
        name: 'Loader',
        context: {},
      },
    });

    expect(member).not.toBe(api);
  });
});
