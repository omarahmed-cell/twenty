// Meeting fields that lived on calendarEvent until the Meeting object replaced them; earlier 2.49 commands still name them
export const LEGACY_CALENDAR_EVENT_FIELD_UNIVERSAL_IDENTIFIERS = {
  recordSource: { universalIdentifier: '7e09807c-ad83-4ad2-b613-4b68fde655d7' },
  recordedVideo: {
    universalIdentifier: '639ca583-524f-4610-ab0c-2a37c907e8d4',
  },
  transcript: { universalIdentifier: '95c36fae-ed54-475b-8403-2242a6ceab5c' },
  locationType: { universalIdentifier: 'c193fff6-70c9-48fe-8376-e1b7c7c9e883' },
  meetingType: { universalIdentifier: '1a6e76f5-923f-42f1-9740-1404c7c1ff45' },
  meetingOutcome: {
    universalIdentifier: '60b96e80-49a2-484f-b92b-6db0759e4538',
  },
  assignedTo: { universalIdentifier: 'd95a25ce-08f6-471a-b0ff-028cdb8cb682' },
  hasMeetingTranscript: {
    universalIdentifier: 'ccf62e53-243c-4901-8c87-e28d7cf5292d',
  },
  hubspotHasTranscript: {
    universalIdentifier: '356e5de7-fcfb-4701-8a3a-183ad6943735',
  },
  meetingSource: {
    universalIdentifier: '2879185a-46ca-47ef-8ada-8f2890c4c28e',
  },
} as const;

export const LEGACY_WORKSPACE_MEMBER_ASSIGNED_CALENDAR_EVENTS_UNIVERSAL_IDENTIFIER =
  'ba4eca98-bb20-48d1-a108-98653cd20d33';
