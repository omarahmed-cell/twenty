import { styled } from '@linaria/react';
import { t } from '@lingui/core/macro';
import { MessageParticipantRole } from 'twenty-shared/types';
import { OverflowingTextWithTooltip } from 'twenty-ui/primitives/typography';
import { themeCssVariables } from 'twenty-ui/theme';

import { type TimelineMessage } from '@/activities/timeline-activities/rows/message/types/TimelineMessage';
import { getTimelineMessageParticipantLabel } from '@/activities/timeline-activities/rows/message/utils/getTimelineMessageParticipantLabel';

const StyledEnvelope = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  display: flex;
  flex-direction: column;
  font-size: ${themeCssVariables.font.size.sm};
  min-width: 0;
  width: 100%;
`;

type EventCardMessageEnvelopeProps = {
  message: TimelineMessage;
};

export const EventCardMessageEnvelope = ({
  message,
}: EventCardMessageEnvelopeProps) => {
  const formatParticipants = (roles: MessageParticipantRole[]) =>
    message.messageParticipants
      .filter((participant) => roles.includes(participant.role))
      .map(getTimelineMessageParticipantLabel)
      .join(', ');

  const sender = formatParticipants([MessageParticipantRole.FROM]);
  const recipients = formatParticipants([
    MessageParticipantRole.TO,
    MessageParticipantRole.CC,
  ]);

  return (
    <StyledEnvelope>
      {sender !== '' && (
        <OverflowingTextWithTooltip text={t`From: ${sender}`} />
      )}
      {recipients !== '' && (
        <OverflowingTextWithTooltip text={t`To: ${recipients}`} />
      )}
    </StyledEnvelope>
  );
};
