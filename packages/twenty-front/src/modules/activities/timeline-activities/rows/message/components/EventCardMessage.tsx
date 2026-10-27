import { t } from '@lingui/core/macro';
import { isNonEmptyString } from '@sniptt/guards';

import { EventCardMessageBody } from '@/activities/timeline-activities/rows/message/components/EventCardMessageBody';
import {
  StyledEventCardMessageContainer,
  StyledEventCardMessageSubject,
} from '@/activities/timeline-activities/rows/message/components/EventCardMessageStyles';
import { EventCardMessageEnvelope } from '@/activities/timeline-activities/rows/message/components/EventCardMessageEnvelope';
import { type TimelineMessage } from '@/activities/timeline-activities/rows/message/types/TimelineMessage';
import { useOpenMessageThreadInSidePanel } from '@/activities/timeline-activities/rows/message/hooks/useOpenMessageThreadInSidePanel';

type EventCardMessageProps = {
  message: TimelineMessage;
  isOpen: boolean;
  notSharedByFullName: string;
};

export const EventCardMessage = ({
  message,
  isOpen,
  notSharedByFullName,
}: EventCardMessageProps) => {
  const { openMessageThreadInSidePanel } = useOpenMessageThreadInSidePanel();

  return (
    <StyledEventCardMessageContainer>
      <StyledEventCardMessageSubject
        onClick={() => openMessageThreadInSidePanel(message.messageThreadId)}
      >
        {isNonEmptyString(message.subject) ? message.subject : t`No subject`}
      </StyledEventCardMessageSubject>
      <EventCardMessageEnvelope message={message} />
      <EventCardMessageBody
        body={message.text}
        isOpen={isOpen}
        notSharedByFullName={notSharedByFullName}
      />
    </StyledEventCardMessageContainer>
  );
};
