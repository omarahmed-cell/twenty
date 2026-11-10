import { CombinedGraphQLErrors } from '@apollo/client/errors';
import { i18n } from '@lingui/core';
import { I18nProvider } from '@lingui/react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FIELD_RESTRICTED_ADDITIONAL_PERMISSIONS_REQUIRED } from 'twenty-shared/constants';
import { ThemeProvider } from 'twenty-ui/theme';

import { useTimelineChannelOwnerName } from '@/activities/timeline-activities/hooks/useTimelineChannelOwnerName';
import { EventRowCalendarEvent } from '@/activities/timeline-activities/rows/calendar/components/EventRowCalendarEvent';
import { useFindOneRecord } from '@/object-record/hooks/useFindOneRecord';
import { UserContext } from '@/users/contexts/UserContext';
import { DateFormat } from '@/localization/constants/DateFormat';
import { TimeFormat } from '@/localization/constants/TimeFormat';

jest.mock('@/object-record/hooks/useFindOneRecord', () => ({
  useFindOneRecord: jest.fn(),
}));
jest.mock('@/side-panel/hooks/useOpenCalendarEventInSidePanel', () => ({
  useOpenCalendarEventInSidePanel: () => ({
    openCalendarEventInSidePanel: jest.fn(),
  }),
}));
jest.mock(
  '@/activities/calendar/components/CalendarEventParticipantsAvatarGroup',
  () => ({ CalendarEventParticipantsAvatarGroup: () => null }),
);
jest.mock('@/activities/calendar/components/CalendarEventRowDetails', () => ({
  CalendarEventRowDetails: ({
    calendarEvent,
  }: {
    calendarEvent: { meetingOutcome: string | null };
  }) => <div>Outcome {calendarEvent.meetingOutcome}</div>,
}));
jest.mock(
  '@/activities/timeline-activities/hooks/useTimelineChannelOwnerName',
  () => ({ useTimelineChannelOwnerName: jest.fn() }),
);
jest.mock(
  '@/activities/timeline-activities/rows/components/EventRowDate',
  () => ({ EventRowDate: () => null }),
);

const renderCard = () =>
  render(
    <I18nProvider i18n={i18n}>
      <ThemeProvider colorScheme="light">
        <UserContext.Provider
          value={{
            dateFormat: DateFormat.MONTH_FIRST,
            timeFormat: TimeFormat.HOUR_24,
            timeZone: 'UTC',
          }}
        >
          <EventRowCalendarEvent
            calendarEventId="calendar-event-id"
            authorFullName="Ada Lovelace"
            happensAt="2026-08-22T10:00:00.000Z"
          />
        </UserContext.Provider>
      </ThemeProvider>
    </I18nProvider>,
  );

describe('EventRowCalendarEvent', () => {
  beforeEach(() => {
    jest.mocked(useTimelineChannelOwnerName).mockReturnValue({
      getChannelOwnerName: () => 'Omar Ahmed',
    });
  });

  it('shows the rep, organizer, time, meeting link, outcome and attendees', async () => {
    const user = userEvent.setup();

    jest.mocked(useFindOneRecord).mockReturnValue({
      record: {
        id: 'calendar-event-id',
        title: 'Discovery call',
        startsAt: '2026-08-22T10:00:00.000Z',
        endsAt: '2026-08-22T11:00:00.000Z',
        isFullDay: false,
        location: '',
        description: 'Agenda: pricing',
        conferenceLink: {
          primaryLinkUrl: 'https://meet.google.com/abc-defg-hij',
          primaryLinkLabel: '',
        },
        meetingOutcome: 'COMPLETED',
        calendarEventParticipants: [
          {
            id: 'organizer-id',
            handle: 'omar@roboost.app',
            displayName: 'Omar Ahmed',
            isOrganizer: true,
          },
          {
            id: 'guest-id',
            handle: 'lead@acme.com',
            displayName: 'Lena Lead',
            isOrganizer: false,
          },
        ],
        calendarChannelEventAssociations: [
          { id: 'association-id', calendarChannelId: 'channel-id' },
        ],
        callRecordings: [],
      },
      loading: false,
      error: undefined,
    } as never);

    renderCard();

    expect(screen.getByText('attended a meeting')).toBeInTheDocument();
    expect(screen.getByText('Discovery call')).toBeInTheDocument();
    expect(
      screen.getByText('10:00 AM → 11:00 AM · Organized by Omar Ahmed'),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Join meeting' })).toHaveAttribute(
      'href',
      'https://meet.google.com/abc-defg-hij',
    );
    expect(screen.getByText('Outcome COMPLETED')).toBeInTheDocument();
    expect(screen.queryByText('Agenda: pricing')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Expand details' }));

    expect(screen.getByText('Attendees')).toBeInTheDocument();
    expect(screen.getByText('Lena Lead')).toBeInTheDocument();
    expect(screen.getByText('Agenda: pricing')).toBeInTheDocument();
  });

  it('names the imported creator when no channel, organizer or member authored it', () => {
    jest.mocked(useTimelineChannelOwnerName).mockReturnValue({
      getChannelOwnerName: () => undefined,
    });
    jest.mocked(useFindOneRecord).mockReturnValue({
      record: {
        id: 'calendar-event-id',
        title: 'Imported meeting',
        startsAt: '2026-07-15T10:00:00.000Z',
        endsAt: '2026-07-15T11:00:00.000Z',
        createdBy: { name: 'Marwan Mansi' },
        calendarEventParticipants: [],
        calendarChannelEventAssociations: [],
        callRecordings: [],
      },
      loading: false,
      error: undefined,
    } as never);

    renderCard();

    expect(screen.getByText('Marwan Mansi')).toBeInTheDocument();
    expect(screen.queryByText('Ada Lovelace')).not.toBeInTheDocument();
  });

  it('does not render a title masked by calendar visibility', () => {
    jest.mocked(useFindOneRecord).mockReturnValue({
      record: {
        id: 'calendar-event-id',
        title: FIELD_RESTRICTED_ADDITIONAL_PERMISSIONS_REQUIRED,
        startsAt: '2026-08-22T10:00:00.000Z',
        endsAt: '2026-08-22T11:00:00.000Z',
        calendarEventParticipants: [],
        calendarChannelEventAssociations: [],
        callRecordings: [],
      },
      loading: false,
      error: undefined,
    } as never);

    renderCard();

    expect(screen.getByText('Not shared')).toBeInTheDocument();
    expect(
      screen.queryByText(FIELD_RESTRICTED_ADDITIONAL_PERMISSIONS_REQUIRED),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/10:00/)).not.toBeInTheDocument();
  });

  it('renders the not-shared state when record access is forbidden', () => {
    jest.mocked(useFindOneRecord).mockReturnValue({
      record: undefined,
      loading: false,
      error: new CombinedGraphQLErrors({
        data: null,
        errors: [
          {
            message: 'Forbidden',
            extensions: { code: 'FORBIDDEN' },
          },
        ],
      }),
    } as never);

    renderCard();

    expect(screen.getByText('Not shared')).toBeInTheDocument();
  });

  it('fails closed when a hidden record is omitted without an error', () => {
    jest.mocked(useFindOneRecord).mockReturnValue({
      record: undefined,
      loading: false,
      error: undefined,
    } as never);

    renderCard();

    expect(screen.getByText('Not shared')).toBeInTheDocument();
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });
});
