import { type calendar_v3 } from 'googleapis';

import { MeetingCalendarSyncService } from 'src/modules/meeting/calendar-sync/services/meeting-calendar-sync.service';

const WORKSPACE_ID = '20202020-0000-4000-8000-000000000001';
const MEMBERS = [
  { id: 'member-rep', email: 'rep@roboost.app', name: 'Rep One' },
  { id: 'member-host', email: 'host@roboost.app', name: 'Host Two' },
];
const ACCOUNT = {
  id: 'account-1',
  handle: 'rep@roboost.app',
  scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
  ownerWorkspaceMemberId: 'member-rep',
};

type QueryCall = { sql: string; params: unknown[] };

const buildService = ({
  existingMeetingId = null,
  people = [] as { id: string; companyId: string | null; email: string }[],
  companies = [] as { id: string; primaryLinkUrl: string }[],
} = {}) => {
  const calls: QueryCall[] = [];
  const query = jest.fn(async (sql: string, params: unknown[] = []) => {
    calls.push({ sql, params });
    if (
      sql.includes('FROM') &&
      sql.includes('"meeting"') &&
      sql.startsWith('SELECT "id", "meetingOutcome"')
    ) {
      return existingMeetingId === null
        ? []
        : [{ id: existingMeetingId, meetingOutcome: 'SCHEDULED' }];
    }
    if (sql.includes('"person" person')) {
      return people.filter((person) =>
        (params[0] as string[]).includes(person.email),
      );
    }
    if (sql.includes('"company"')) {
      return companies.map((company) => ({ ...company, secondaryLinks: [] }));
    }
    if (sql.includes('"opportunity"')) {
      return [{ id: 'deal-open' }];
    }

    return [];
  });
  const manager = { query };
  const coreDataSource = {
    query,
    transaction: jest.fn(async (callback: (m: typeof manager) => unknown) =>
      callback(manager),
    ),
  };
  const twentyConfigService = {
    get: jest.fn((key: string) =>
      key === 'UNIFIED_EMAIL_INTERNAL_DOMAINS'
        ? ['roboost.app']
        : ['gmail.com'],
    ),
  };
  const service = new MeetingCalendarSyncService(
    coreDataSource as never,
    twentyConfigService as never,
    {} as never,
  );

  return { service, calls };
};

const buildEvent = (
  overrides: Partial<calendar_v3.Schema$Event> = {},
): calendar_v3.Schema$Event => ({
  id: 'event-1',
  iCalUID: 'ical-1',
  status: 'confirmed',
  summary: 'Intro call',
  start: { dateTime: '2026-12-01T10:00:00Z', timeZone: 'Africa/Cairo' },
  end: { dateTime: '2026-12-01T10:30:00Z' },
  organizer: { email: 'host@roboost.app' },
  attendees: [
    { email: 'host@roboost.app', organizer: true, responseStatus: 'accepted' },
    { email: 'rep@roboost.app', self: true, responseStatus: 'accepted' },
    { email: 'jane@acme.com', responseStatus: 'needsAction' },
  ],
  ...overrides,
});

const handle = (
  service: MeetingCalendarSyncService,
  event: calendar_v3.Schema$Event,
) =>
  service.handleEvent({
    workspaceId: WORKSPACE_ID,
    account: ACCOUNT,
    members: MEMBERS,
    event,
  });

const insertedMeeting = (calls: QueryCall[]) =>
  calls.find(
    ({ sql }) => sql.includes('INSERT INTO') && sql.includes('"meeting" ('),
  );

describe('MeetingCalendarSyncService.handleEvent', () => {
  it('creates a meeting for a known contact with the organizer as host and links person, company and open deals', async () => {
    const { service, calls } = buildService({
      people: [
        {
          id: 'person-jane',
          companyId: 'company-acme',
          email: 'jane@acme.com',
        },
      ],
    });

    expect(await handle(service, buildEvent())).toBe('CREATED');

    const insert = insertedMeeting(calls);

    expect(insert?.params[5]).toBe('member-host');
    expect(insert?.sql).toContain("'CALENDAR_SYNC'");
    expect(insert?.sql).toContain("'SCHEDULED'");

    const targets = calls
      .filter(({ sql }) => sql.includes('"meetingTarget"'))
      .map(
        ({ sql, params }) => `${sql.match(/"(target\w+)"/)?.[1]}:${params[1]}`,
      );

    expect(targets).toEqual([
      'targetPersonId:person-jane',
      'targetCompanyId:company-acme',
      'targetOpportunityId:deal-open',
    ]);
  });

  it('matches a company by domain without creating contacts', async () => {
    const { service, calls } = buildService({
      companies: [{ id: 'company-acme', primaryLinkUrl: 'https://acme.com' }],
    });

    expect(await handle(service, buildEvent())).toBe('CREATED');
    expect(
      calls.some(
        ({ sql }) => sql.includes('INSERT INTO') && sql.includes('"person"'),
      ),
    ).toBe(false);
  });

  it('falls back to the calendar owner when the organizer is not a member', async () => {
    const { service, calls } = buildService({
      people: [{ id: 'person-jane', companyId: null, email: 'jane@acme.com' }],
    });

    await handle(
      service,
      buildEvent({ organizer: { email: 'jane@acme.com' } }),
    );

    expect(insertedMeeting(calls)?.params[5]).toBe('member-rep');
  });

  it.each([
    [
      'internal-only',
      buildEvent({
        attendees: [
          { email: 'host@roboost.app' },
          { email: 'rep@roboost.app', self: true },
        ],
      }),
    ],
    [
      'declined',
      buildEvent({
        attendees: [
          { email: 'rep@roboost.app', self: true, responseStatus: 'declined' },
          { email: 'jane@acme.com' },
        ],
      }),
    ],
    [
      'all-day',
      buildEvent({
        start: { date: '2026-12-01' },
        end: { date: '2026-12-02' },
      }),
    ],
    ['private', buildEvent({ visibility: 'private' })],
    ['out of office', buildEvent({ eventType: 'outOfOffice' })],
  ])('skips %s events', async (_label, event) => {
    const { service, calls } = buildService({
      people: [{ id: 'person-jane', companyId: null, email: 'jane@acme.com' }],
    });

    expect(await handle(service, event)).toBe('SKIPPED');
    expect(insertedMeeting(calls)).toBeUndefined();
  });

  it('skips events with no CRM match, ignoring personal domains', async () => {
    const { service } = buildService({
      companies: [{ id: 'company-gmail', primaryLinkUrl: 'https://gmail.com' }],
    });

    expect(
      await handle(
        service,
        buildEvent({
          attendees: [
            { email: 'rep@roboost.app', self: true },
            { email: 'someone@gmail.com' },
          ],
        }),
      ),
    ).toBe('SKIPPED');
  });

  it('marks a linked meeting canceled when Google cancels the event', async () => {
    const { service, calls } = buildService({ existingMeetingId: 'meeting-1' });

    expect(await handle(service, { id: 'event-1', status: 'cancelled' })).toBe(
      'CANCELED',
    );
    expect(
      calls.some(({ sql }) => sql.includes(`"meetingOutcome" = 'CANCELED'`)),
    ).toBe(true);
  });
});
