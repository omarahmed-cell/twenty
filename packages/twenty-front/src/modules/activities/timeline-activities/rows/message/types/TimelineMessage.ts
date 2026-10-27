import { type EmailThreadMessage } from '@/activities/emails/types/EmailThreadMessage';

export type TimelineMessage = Pick<
  EmailThreadMessage,
  | 'id'
  | 'text'
  | 'subject'
  | 'receivedAt'
  | 'messageThreadId'
  | 'messageParticipants'
  | 'isDraft'
> & {
  messageChannelMessageAssociations: {
    id: string;
    messageChannelId: string | null;
    direction: 'INCOMING' | 'OUTGOING';
  }[];
  __typename: 'Message';
};
