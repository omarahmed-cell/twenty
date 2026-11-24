import { type TimelineActivity } from '@/activities/timeline-activities/types/TimelineActivity';
import { getRoboostDatePresetRange } from '@/roboost-app/history/utils/getRoboostDatePresetRange';
import { getRoboostFieldHistoryEntries } from '@/roboost-app/history/utils/getRoboostFieldHistoryEntries';
import { getRoboostFieldHistorySource } from '@/roboost-app/history/utils/getRoboostFieldHistorySource';
import { FieldActorSource } from 'twenty-shared/types';

const buildRow = (
  overrides: Partial<TimelineActivity> & { id: string },
): TimelineActivity =>
  ({
    happensAt: '2026-11-20T10:00:00.000Z',
    linkedRecordId: null,
    workspaceMemberId: null,
    workspaceMember: null,
    properties: {},
    ...overrides,
  }) as unknown as TimelineActivity;

describe('getRoboostFieldHistoryEntries', () => {
  const rows = [
    buildRow({
      id: 'older',
      happensAt: '2026-11-01T09:00:00.000Z',
      workspaceMemberId: 'member-1',
      workspaceMember: {
        name: { firstName: 'Naira', lastName: 'Mohamed' },
      } as TimelineActivity['workspaceMember'],
      properties: { diff: { stage: { before: 'NEW', after: 'OPEN' } } },
    }),
    buildRow({
      id: 'newer',
      happensAt: '2026-11-09T09:00:00.000Z',
      properties: {
        diff: { stage: { before: 'OPEN', after: 'WON' } },
        updatedBy: {
          source: FieldActorSource.WORKFLOW,
          name: 'Workflow',
          workspaceMemberId: null,
          context: { workflowId: 'workflow-1', workflowRunId: 'run-1' },
        },
      },
    }),
    buildRow({
      id: 'other-field',
      properties: { diff: { city: { before: 'A', after: 'B' } } },
    }),
    buildRow({
      id: 'linked',
      linkedRecordId: 'note-1',
      properties: { diff: { stage: { before: 'X', after: 'Y' } } },
    }),
  ];

  it('keeps only own updates of the field, newest first, with their source', () => {
    const entries = getRoboostFieldHistoryEntries({
      timelineActivities: rows,
      field: { name: 'stage', settings: null },
      isUpdateRow: () => true,
    });

    expect(entries.map(({ id, after, source }) => [id, after, source])).toEqual(
      [
        ['newer', 'WON', 'workflow'],
        ['older', 'OPEN', 'user'],
      ],
    );
    expect(entries[0].workflowId).toBe('workflow-1');
    expect(entries[1].actorName).toBe('Naira Mohamed');
  });

  it('matches a relation by its join column', () => {
    const entries = getRoboostFieldHistoryEntries({
      timelineActivities: [
        buildRow({
          id: 'owner',
          properties: {
            diff: { accountOwnerId: { before: null, after: 'member-2' } },
          },
        }),
      ],
      field: { name: 'accountOwner', settings: null },
      isUpdateRow: () => true,
    });

    expect(entries.map(({ id }) => id)).toEqual(['owner']);
  });
});

describe('getRoboostFieldHistorySource', () => {
  it('maps actor sources to the history filter values', () => {
    const source = (actorSource: FieldActorSource) =>
      getRoboostFieldHistorySource({
        updatedBy: {
          source: actorSource,
          name: '',
          workspaceMemberId: null,
          context: {},
        },
        workspaceMemberId: null,
      });

    expect(source(FieldActorSource.MANUAL)).toBe('user');
    expect(source(FieldActorSource.IMPORT)).toBe('import');
    expect(source(FieldActorSource.API)).toBe('api');
    expect(source(FieldActorSource.SYSTEM)).toBe('system');
  });

  it('labels recomputed values as calculated whoever triggered them', () => {
    const entries = getRoboostFieldHistoryEntries({
      timelineActivities: [
        buildRow({
          id: 'calculated',
          workspaceMemberId: 'member-1',
          properties: {
            diff: { completion: { before: 0.4, after: 0.429 } },
            isCalculated: true,
          },
        }),
      ],
      field: { name: 'completion', settings: null },
      isUpdateRow: () => true,
    });

    expect(entries.map(({ source }) => source)).toEqual(['calculated']);
  });

  it('falls back to the member on rows written before the actor was kept', () => {
    expect(
      getRoboostFieldHistorySource({
        updatedBy: undefined,
        workspaceMemberId: 'member-1',
      }),
    ).toBe('user');
    expect(
      getRoboostFieldHistorySource({
        updatedBy: undefined,
        workspaceMemberId: null,
      }),
    ).toBe('system');
  });
});

describe('getRoboostDatePresetRange', () => {
  const wednesday = new Date(2026, 10, 18, 15, 30);

  it('starts weeks on Monday', () => {
    const { start, end } = getRoboostDatePresetRange('thisWeek', wednesday);

    expect(start).toEqual(new Date(2026, 10, 16));
    expect(end).toEqual(new Date(2026, 10, 23));
  });

  it('covers the previous calendar month', () => {
    const { start, end } = getRoboostDatePresetRange('lastMonth', wednesday);

    expect(start).toEqual(new Date(2026, 9, 1));
    expect(end).toEqual(new Date(2026, 10, 1));
  });

  it('covers yesterday only', () => {
    const { start, end } = getRoboostDatePresetRange('yesterday', wednesday);

    expect(start).toEqual(new Date(2026, 10, 17));
    expect(end).toEqual(new Date(2026, 10, 18));
  });
});
