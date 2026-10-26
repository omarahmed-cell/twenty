import { timelineCalendarEventCallRecordingFragment } from '@/activities/calendar/graphql/queries/fragments/timelineCalendarEventCallRecordingFragment';
import { timelineCalendarEventParticipantFragment } from '@/activities/calendar/graphql/queries/fragments/timelineCalendarEventParticipantFragment';
import { gql } from '@apollo/client';

export const timelineCalendarEventFragment = gql`
  fragment TimelineCalendarEventFragment on TimelineCalendarEvent {
    id
    title
    description
    location
    startsAt
    endsAt
    isFullDay
    isCanceled
    visibility
    locationType
    meetingType
    meetingOutcome
    assignedToId
    participants {
      ...TimelineCalendarEventParticipantFragment
    }
    callRecordings {
      ...TimelineCalendarEventCallRecordingFragment
    }
  }
  ${timelineCalendarEventParticipantFragment}
  ${timelineCalendarEventCallRecordingFragment}
`;
