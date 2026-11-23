import { gql } from '@apollo/client';

export const MEETING_HOST_CALENDAR = gql`
  query MeetingHostCalendar(
    $hostWorkspaceMemberId: String!
    $timeMin: String!
    $timeMax: String!
  ) {
    meetingHostCalendar(
      hostWorkspaceMemberId: $hostWorkspaceMemberId
      timeMin: $timeMin
      timeMax: $timeMax
    ) {
      source
      slots {
        startsAt
        endsAt
        title
      }
    }
  }
`;

export const SAVE_MEETING = gql`
  mutation SaveMeeting($input: SaveMeetingInput!) {
    saveMeeting(input: $input) {
      meetingId
      warning
    }
  }
`;
