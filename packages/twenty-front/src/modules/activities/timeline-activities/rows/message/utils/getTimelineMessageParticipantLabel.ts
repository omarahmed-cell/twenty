import { type EmailThreadMessageParticipant } from '@/activities/emails/types/EmailThreadMessageParticipant';
import { getDisplayNameFromParticipant } from '@/activities/emails/utils/getDisplayNameFromParticipant';

export const getTimelineMessageParticipantLabel = (
  participant: EmailThreadMessageParticipant,
) => {
  const displayName = getDisplayNameFromParticipant({
    participant,
    shouldUseFullName: true,
  });

  return displayName === participant.handle
    ? participant.handle
    : `${displayName} <${participant.handle}>`;
};
