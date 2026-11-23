import { type CalendarEvent } from '@/activities/calendar/types/CalendarEvent';

export type TimelineCalendarEventRecord = CalendarEvent & {
  createdBy?: { name?: string | null } | null;
  calendarChannelEventAssociations: {
    id: string;
    calendarChannelId: string;
  }[];
};
