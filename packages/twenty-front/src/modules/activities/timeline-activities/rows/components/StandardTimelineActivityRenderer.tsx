import { lazy, type ComponentType } from 'react';
import {
  isStandardTimelineActivityRendererUniversalIdentifier,
  STANDARD_TIMELINE_ACTIVITY_RENDERER_UNIVERSAL_IDENTIFIERS,
  type StandardTimelineActivityRendererUniversalIdentifier,
} from 'twenty-shared/timeline';
import { isDefined } from 'twenty-shared/utils';

import { type StandardTimelineActivityRendererProps } from '@/activities/timeline-activities/rows/components/TimelineActivityRenderer';
import { isTimelineActivityWithLinkedRecord } from '@/activities/timeline-activities/types/TimelineActivity';

const EventRowCalendarEvent = lazy(() =>
  import('@/activities/timeline-activities/rows/calendar/components/EventRowCalendarEvent').then(
    (module) => ({ default: module.EventRowCalendarEvent }),
  ),
);

const EventRowMessage = lazy(() =>
  import('@/activities/timeline-activities/rows/message/components/EventRowMessage').then(
    (module) => ({ default: module.EventRowMessage }),
  ),
);

type MessageTimelineActivityRendererProps =
  StandardTimelineActivityRendererProps;

const MessageTimelineActivityRenderer = ({
  event,
  authorFullName,
}: MessageTimelineActivityRendererProps) =>
  isTimelineActivityWithLinkedRecord(event) ? (
    <EventRowMessage
      messageId={event.linkedRecordId}
      authorFullName={authorFullName}
      happensAt={event.happensAt}
    />
  ) : null;

type CalendarEventTimelineActivityRendererProps =
  StandardTimelineActivityRendererProps;

const CalendarEventTimelineActivityRenderer = ({
  event,
  authorFullName,
}: CalendarEventTimelineActivityRendererProps) =>
  isTimelineActivityWithLinkedRecord(event) ? (
    <EventRowCalendarEvent
      calendarEventId={event.linkedRecordId}
      authorFullName={authorFullName}
      happensAt={event.happensAt}
    />
  ) : null;

const STANDARD_TIMELINE_ACTIVITY_RENDERERS: Record<
  StandardTimelineActivityRendererUniversalIdentifier,
  ComponentType<StandardTimelineActivityRendererProps>
> = {
  [STANDARD_TIMELINE_ACTIVITY_RENDERER_UNIVERSAL_IDENTIFIERS.message]:
    MessageTimelineActivityRenderer,
  [STANDARD_TIMELINE_ACTIVITY_RENDERER_UNIVERSAL_IDENTIFIERS.calendarEvent]:
    CalendarEventTimelineActivityRenderer,
};

export const getStandardTimelineActivityRenderer = (
  universalIdentifier: string | null | undefined,
): ComponentType<StandardTimelineActivityRendererProps> | null => {
  if (
    !isDefined(universalIdentifier) ||
    !isStandardTimelineActivityRendererUniversalIdentifier(universalIdentifier)
  ) {
    return null;
  }

  return STANDARD_TIMELINE_ACTIVITY_RENDERERS[universalIdentifier];
};
