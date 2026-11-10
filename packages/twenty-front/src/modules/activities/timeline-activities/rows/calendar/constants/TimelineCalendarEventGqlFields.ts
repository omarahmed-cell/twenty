import { type RecordGqlFields } from 'twenty-shared/types';

export const TIMELINE_CALENDAR_EVENT_GQL_FIELDS: RecordGqlFields = {
  id: true,
  title: true,
  startsAt: true,
  endsAt: true,
  isFullDay: true,
  isCanceled: true,
  location: true,
  description: true,
  conferenceLink: true,
  meetingOutcome: true,
  meetingType: true,
  locationType: true,
  assignedToId: true,
  createdBy: true,
  calendarEventParticipants: {
    id: true,
    handle: true,
    displayName: true,
    isOrganizer: true,
    responseStatus: true,
    person: true,
    workspaceMember: true,
  },
  calendarChannelEventAssociations: {
    id: true,
    calendarChannelId: true,
  },
  callRecordings: {
    id: true,
    status: true,
    applicationId: true,
  },
};
