import { type RecordGqlFields } from 'twenty-shared/types';

export const TIMELINE_MESSAGE_GQL_FIELDS: RecordGqlFields = {
  id: true,
  text: true,
  subject: true,
  receivedAt: true,
  isDraft: true,
  messageThreadId: true,
  messageParticipants: {
    id: true,
    role: true,
    handle: true,
    displayName: true,
    person: true,
    workspaceMember: true,
  },
  messageChannelMessageAssociations: {
    id: true,
    messageChannelId: true,
    direction: true,
  },
};
