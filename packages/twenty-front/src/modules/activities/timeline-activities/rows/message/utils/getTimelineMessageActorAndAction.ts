import { t } from '@lingui/core/macro';
import { MessageParticipantRole } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

import { getDisplayNameFromParticipant } from '@/activities/emails/utils/getDisplayNameFromParticipant';
import { type TimelineMessage } from '@/activities/timeline-activities/rows/message/types/TimelineMessage';

// Synced emails belong to the rep whose mailbox they came from; the sender
// only becomes the actor when no workspace member owns that mailbox
export const getTimelineMessageActorAndAction = ({
  message,
  isReply,
  channelOwnerName,
}: {
  message: TimelineMessage;
  isReply: boolean;
  channelOwnerName: string | undefined;
}): { actorName: string; actionLabel: string } => {
  const sender = message.messageParticipants.find(
    (participant) => participant.role === MessageParticipantRole.FROM,
  );
  const senderName = isDefined(sender)
    ? getDisplayNameFromParticipant({
        participant: sender,
        shouldUseFullName: true,
      })
    : t`Unknown sender`;

  const isOutgoing = message.messageChannelMessageAssociations.some(
    (association) => association.direction === 'OUTGOING',
  );

  if (isOutgoing || !isDefined(channelOwnerName)) {
    return {
      actorName: isOutgoing ? (channelOwnerName ?? senderName) : senderName,
      actionLabel: isReply ? t`replied to an email` : t`sent an email`,
    };
  }

  return {
    actorName: channelOwnerName,
    actionLabel: isReply
      ? t`received a reply from ${senderName}`
      : t`received an email from ${senderName}`,
  };
};
