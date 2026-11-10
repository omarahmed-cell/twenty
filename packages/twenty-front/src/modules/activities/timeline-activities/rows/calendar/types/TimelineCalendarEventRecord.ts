import { type CalendarEvent } from '@/activities/calendar/types/CalendarEvent';

export type TimelineCalendarEventRecord = CalendarEvent & {
  meetingOutcome: string | null;
  meetingType: string | null;
  locationType: string | null;
  assignedToId: string | null;
  createdBy?: { name?: string | null } | null;
  calendarChannelEventAssociations: {
    id: string;
    calendarChannelId: string;
  }[];
};
