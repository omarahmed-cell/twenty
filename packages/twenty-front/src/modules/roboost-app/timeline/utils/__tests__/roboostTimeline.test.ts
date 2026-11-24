import { type TimelineActivity } from '@/activities/timeline-activities/types/TimelineActivity';
import { getRoboostEmailThreadKey } from '@/roboost-app/timeline/utils/getRoboostEmailThreadKey';
import { mapRoboostTimelineUpdates } from '@/roboost-app/timeline/utils/mapRoboostTimelineUpdates';
import { parseRoboostEmailAddresses } from '@/roboost-app/timeline/utils/parseRoboostEmailAddresses';
import { splitRoboostEmailBody } from '@/roboost-app/timeline/utils/splitRoboostEmailBody';
import { FieldActorSource } from 'twenty-shared/types';

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
      createdTitle: 'Company created',
    });

  it('keeps only the record created row', () => {
    const items = map([
      row('created', 'created'),
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
      row('deleted', 'deleted'),
      row('person-link', 'linked', {}, {
        linkedRecordId: 'person-1',
        linkedObjectMetadataId: 'person-object',
      } as Partial<TimelineActivity>),
    ]);

    expect(items.map(({ typeKey, title }) => [typeKey, title])).toEqual([
      ['recordCreated', 'Company created'],
    ]);
  });
});
