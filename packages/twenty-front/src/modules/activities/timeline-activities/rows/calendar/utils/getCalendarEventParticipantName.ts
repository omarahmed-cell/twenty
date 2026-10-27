import { type CalendarEventParticipant } from '@/activities/calendar/types/CalendarEventParticipant';
import { getEmailIdentityDisplayName } from '@/activities/emails/utils/getEmailIdentityDisplayName';
import { getFullName } from '@/activities/timeline-activities/utils/getFullName';

export const getCalendarEventParticipantName = (
  participant: CalendarEventParticipant,
) =>
  getEmailIdentityDisplayName({
    personName: getFullName(participant.person?.name),
    workspaceMemberName: getFullName(participant.workspaceMember?.name),
    displayName: participant.displayName,
    handle: participant.handle,
  });
