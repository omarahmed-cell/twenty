import { type TimelineActivity } from '@/activities/timeline-activities/types/TimelineActivity';
import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { getRoboostEmailThreadKey } from '@/roboost-app/timeline/utils/getRoboostEmailThreadKey';
import { mapRoboostTimelineUpdates } from '@/roboost-app/timeline/utils/mapRoboostTimelineUpdates';
import { parseRoboostEmailAddresses } from '@/roboost-app/timeline/utils/parseRoboostEmailAddresses';
import { splitRoboostEmailBody } from '@/roboost-app/timeline/utils/splitRoboostEmailBody';
import { FieldActorSource } from 'twenty-shared/types';
import { FieldMetadataType } from '~/generated-metadata/graphql';

describe('splitRoboostEmailBody', () => {
  it('cuts at an Outlook rule and keeps the reply above it', () => {
    const { main, quoted } = splitRoboostEmailBody(
      "that's for the meeting today\n\nBest Regards,\nMahmoud\n________________________________\nFrom: Moustafa <m@roboost.app>\nSent: Thursday",
    );

    expect(main).toBe("that's for the meeting today\n\nBest Regards,\nMahmoud");
    expect(quoted.startsWith('________________')).toBe(true);
  });

  it('cuts at a two-line Gmail "On ... wrote:" header', () => {
    const { main, quoted } = splitRoboostEmailBody(
      'Dear Eng Mahmoud,\n\nCredentials below.\n\nOn Thu, Jun 11, 2026 at 3:52 PM Mahmoud <m@b.com>\nwrote:\n\n> earlier',
    );

    expect(main).toBe('Dear Eng Mahmoud,\n\nCredentials below.');
    expect(quoted).toContain('> earlier');
  });

  it('keeps a body without quoted history whole', () => {
    expect(splitRoboostEmailBody('Hello\nthere').quoted).toBe('');
  });
});

describe('parseRoboostEmailAddresses', () => {
  it('reads names and lowercased addresses from comma and semicolon lists', () => {
    expect(
      parseRoboostEmailAddresses(
        'Mina Sameh <Mina.Sameh@bgomla.com>; tramadan@inetworkme.com',
      ),
    ).toEqual([
      { name: 'Mina Sameh', email: 'mina.sameh@bgomla.com' },
      { name: 'tramadan@inetworkme.com', email: 'tramadan@inetworkme.com' },
    ]);
  });
});

describe('getRoboostEmailThreadKey', () => {
  it('groups replies and forwards with the original subject', () => {
    expect(
      getRoboostEmailThreadKey('Re: [External] DMS Kickoff  Meeting'),
    ).toBe(getRoboostEmailThreadKey('DMS Kickoff Meeting'));
  });
});

describe('mapRoboostTimelineUpdates', () => {
  const fields = [
    {
      name: 'lifecycleStage',
      label: 'Lifecycle Stage',
      type: FieldMetadataType.SELECT,
      options: [{ value: 'LEAD', label: 'Lead' }],
      isSystem: false,
    },
    {
      name: 'city',
      label: 'City',
      type: FieldMetadataType.TEXT,
      isSystem: false,
    },
  ] as unknown as FieldMetadataItem[];
  const labels = {
    created: (objectLabel: string) => `${objectLabel} created`,
    changed: (fieldLabels: string) => `Updated ${fieldLabels}`,
    deleted: (objectLabel: string) => `${objectLabel} deleted`,
    restored: (objectLabel: string) => `${objectLabel} restored`,
    linked: (linkedName: string) => `Associated with ${linkedName}`,
    unlinked: (linkedName: string) => `Removed ${linkedName}`,
    updated: 'Record updated',
    empty: 'Cleared',
  };
  const row = (
    id: string,
    action: string,
    properties: Record<string, unknown> = {},
    extra: Partial<TimelineActivity> = {},
  ) =>
    ({
      id,
      happensAt: '2026-11-20T10:00:00.000Z',
      linkedRecordId: null,
      workspaceMemberId: null,
      properties,
      action,
      ...extra,
    }) as unknown as TimelineActivity;

  const map = (rows: TimelineActivity[]) =>
    mapRoboostTimelineUpdates({
      timelineActivities: rows,
      getAction: (timelineActivity) =>
        (timelineActivity as unknown as { action: string }).action,
      fields,
      objectLabel: 'Company',
      linkedObjectNameById: new Map([
        ['note-object', 'note'],
        ['person-object', 'person'],
      ]),
      labels,
    });

  it('sorts updates into created, stage, field and workflow types', () => {
    const items = map([
      row('created', 'created'),
      row('stage', 'updated', {
        diff: { lifecycleStage: { before: null, after: 'LEAD' } },
      }),
      row('city', 'updated', { diff: { city: { before: 'A', after: 'B' } } }),
      row('workflow', 'updated', {
        diff: { city: { before: 'B', after: 'C' } },
        updatedBy: {
          source: FieldActorSource.WORKFLOW,
          name: 'Workflow',
          workspaceMemberId: null,
          context: {},
        },
      }),
    ]);

    expect(items.map(({ typeKey }) => typeKey)).toEqual([
      'recordCreated',
      'stageChanges',
      'fieldChanges',
      'workflowActivity',
    ]);
    expect(items[1].body).toBe('Lifecycle Stage → Lead');
  });

  it('skips rows that only repeat an activity card', () => {
    const items = map([
      row(
        'note-link',
        'linked',
        {},
        {
          linkedRecordId: 'note-1',
          linkedObjectMetadataId: 'note-object',
        },
      ),
      row('person-link', 'linked', {}, {
        linkedRecordId: 'person-1',
        linkedObjectMetadataId: 'person-object',
        linkedRecordCachedName: 'Dario',
      } as Partial<TimelineActivity>),
    ]);

    expect(items.map(({ title }) => title)).toEqual(['Associated with Dario']);
  });
});
