// Fields shown first on an expanded card, matching HubSpot's call/meeting/task layouts; the rest follow
export const ROBOOST_ACTIVITY_CARD_FIELD_NAMES: Record<string, string[]> = {
  call: [
    'contacted',
    'callType',
    'outcome',
    'direction',
    'activityDate',
    'assignedTo',
  ],
  communication: ['channelType', 'contacted', 'direction', 'activityDate'],
  task: ['status', 'dueAt', 'assignee', 'priority', 'taskType'],
  calendarEvent: [
    'startsAt',
    'endsAt',
    'location',
    'meetingOutcome',
    'meetingType',
  ],
  note: ['activityDate', 'assignedTo'],
};
