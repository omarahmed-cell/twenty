import { CombinedGraphQLErrors } from '@apollo/client/errors';
import { isNonEmptyString } from '@sniptt/guards';
import { t } from '@lingui/core/macro';
import { type ReactNode, useState } from 'react';
import { CoreObjectNameSingular } from 'twenty-shared/types';
import { isDefined, isFieldValueRestricted } from 'twenty-shared/utils';

import { CalendarEventNotSharedContent } from '@/activities/calendar/components/CalendarEventNotSharedContent';
import { hasCalendarEventEnded } from '@/activities/calendar/utils/hasCalendarEventEnded';
import { useTimelineChannelOwnerName } from '@/activities/timeline-activities/hooks/useTimelineChannelOwnerName';
import { EventCardCalendarEvent } from '@/activities/timeline-activities/rows/calendar/components/EventCardCalendarEvent';
import { TIMELINE_CALENDAR_EVENT_GQL_FIELDS } from '@/activities/timeline-activities/rows/calendar/constants/TimelineCalendarEventGqlFields';
import { type TimelineCalendarEventRecord } from '@/activities/timeline-activities/rows/calendar/types/TimelineCalendarEventRecord';
import { getCalendarEventParticipantName } from '@/activities/timeline-activities/rows/calendar/utils/getCalendarEventParticipantName';
import { EventRowWithCard } from '@/activities/timeline-activities/rows/components/EventRowWithCard';
import { useFindOneRecord } from '@/object-record/hooks/useFindOneRecord';

const hasGraphQLErrorCode = (error: unknown, code: string) =>
  CombinedGraphQLErrors.is(error) &&
  error.errors.some((graphQLError) => graphQLError.extensions?.code === code);

type EventRowCalendarEventProps = {
  calendarEventId: string;
  authorFullName: string;
  isAuthorWorkspaceMember?: boolean;
  happensAt: string;
};

export const EventRowCalendarEvent = ({
  calendarEventId,
  authorFullName,
  isAuthorWorkspaceMember = false,
  happensAt,
}: EventRowCalendarEventProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { getChannelOwnerName } = useTimelineChannelOwnerName();

  const {
    record: calendarEvent,
    loading,
    error,
  } = useFindOneRecord<TimelineCalendarEventRecord>({
    objectNameSingular: CoreObjectNameSingular.CalendarEvent,
    objectRecordId: calendarEventId,
    recordGqlFields: TIMELINE_CALENDAR_EVENT_GQL_FIELDS,
  });

  const fallbackRow = (content: ReactNode) => (
    <EventRowWithCard
      actorName={authorFullName}
      actionLabel={t`attended a meeting`}
      happensAt={happensAt}
      isOpen={false}
    >
      {content}
    </EventRowWithCard>
  );

  if (isDefined(error)) {
    if (hasGraphQLErrorCode(error, 'FORBIDDEN')) {
      return fallbackRow(<CalendarEventNotSharedContent />);
    }

    return fallbackRow(
      hasGraphQLErrorCode(error, 'NOT_FOUND')
        ? t`Calendar event not found`
        : t`Error loading calendar event`,
    );
  }

  if (loading) {
    return fallbackRow(t`Loading...`);
  }

  if (
    !isDefined(calendarEvent) ||
    isFieldValueRestricted(calendarEvent.title)
  ) {
    return fallbackRow(<CalendarEventNotSharedContent />);
  }

  if (!isDefined(calendarEvent.startsAt)) {
    return fallbackRow(t`Calendar event has no start date`);
  }

  const organizer = calendarEvent.calendarEventParticipants?.find(
    (participant) => participant.isOrganizer,
  );
  const actorName =
    getChannelOwnerName(
      calendarEvent.calendarChannelEventAssociations.map(
        (association) => association.calendarChannelId,
      ),
    ) ??
    (isDefined(organizer)
      ? getCalendarEventParticipantName(organizer)
      : !isAuthorWorkspaceMember &&
          isNonEmptyString(calendarEvent.createdBy?.name)
        ? calendarEvent.createdBy.name
        : authorFullName);

  return (
    <EventRowWithCard
      actorName={actorName}
      actionLabel={
        hasCalendarEventEnded(calendarEvent)
          ? t`attended a meeting`
          : t`has an upcoming meeting`
      }
      happensAt={happensAt}
      isOpen={isOpen}
      onToggle={setIsOpen}
    >
      <EventCardCalendarEvent calendarEvent={calendarEvent} isOpen={isOpen} />
    </EventRowWithCard>
  );
};
