import { styled } from '@linaria/react';
import { t } from '@lingui/core/macro';
import { isNonEmptyString } from '@sniptt/guards';
import { Fragment } from 'react';
import { MessageParticipantRole } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import { themeCssVariables } from 'twenty-ui/theme';

import { getDisplayNameFromParticipant } from '@/activities/emails/utils/getDisplayNameFromParticipant';
import { EventCardMessageBody } from '@/activities/timeline-activities/rows/message/components/EventCardMessageBody';
import { EventCardMessageEnvelope } from '@/activities/timeline-activities/rows/message/components/EventCardMessageEnvelope';
import {
  StyledEventCardMessageContainer,
  StyledEventCardMessageSubject,
} from '@/activities/timeline-activities/rows/message/components/EventCardMessageStyles';
import { useOpenMessageThreadInSidePanel } from '@/activities/timeline-activities/rows/message/hooks/useOpenMessageThreadInSidePanel';
import { type TimelineMessage } from '@/activities/timeline-activities/rows/message/types/TimelineMessage';
import { dateLocaleState } from '@/localization/states/dateLocaleState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { beautifyPastDateRelativeToNow } from '~/utils/date-utils';

const StyledTitleRow = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  justify-content: space-between;
  min-width: 0;
`;

const StyledMessageCount = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  flex-shrink: 0;
  font-size: ${themeCssVariables.font.size.sm};
`;

const StyledThreadMessage = styled.div`
  border-top: 1px solid ${themeCssVariables.border.color.light};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[1]};
  padding-top: ${themeCssVariables.spacing[2]};
`;

const StyledThreadMessageHeader = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  justify-content: space-between;
`;

const StyledSender = styled.span`
  color: ${themeCssVariables.font.color.primary};
  font-weight: ${themeCssVariables.font.weight.medium};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledSecondaryText = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  flex-shrink: 0;
  font-size: ${themeCssVariables.font.size.sm};
`;

type EventCardEmailRepliesProps = {
  messages: TimelineMessage[];
  isOpen: boolean;
  notSharedByFullName: string;
};

export const EventCardEmailReplies = ({
  messages,
  isOpen,
  notSharedByFullName,
}: EventCardEmailRepliesProps) => {
  const { localeCatalog } = useAtomStateValue(dateLocaleState);
  const { openMessageThreadInSidePanel } = useOpenMessageThreadInSidePanel();

  const firstMessage = messages[0];
  const lastMessage = messages[messages.length - 1];
  const hiddenMessageCount = messages.length - 2;
  const displayedMessages = isOpen ? messages : [firstMessage, lastMessage];
  const messageCount = messages.length;

  const getSenderName = (message: TimelineMessage) => {
    const sender = message.messageParticipants.find(
      (participant) => participant.role === MessageParticipantRole.FROM,
    );

    return isDefined(sender)
      ? getDisplayNameFromParticipant({
          participant: sender,
          shouldUseFullName: true,
        })
      : t`Unknown sender`;
  };

  return (
    <StyledEventCardMessageContainer>
      <StyledTitleRow>
        <StyledEventCardMessageSubject
          onClick={() =>
            openMessageThreadInSidePanel(firstMessage.messageThreadId)
          }
        >
          {isNonEmptyString(firstMessage.subject)
            ? firstMessage.subject
            : t`No subject`}
        </StyledEventCardMessageSubject>
        <StyledMessageCount>{t`Email replies (${messageCount})`}</StyledMessageCount>
      </StyledTitleRow>
      {displayedMessages.map((message, index) => (
        <Fragment key={message.id}>
          {!isOpen && index === 1 && hiddenMessageCount > 0 && (
            <StyledSecondaryText>
              {t`${hiddenMessageCount} more in between`}
            </StyledSecondaryText>
          )}
          <StyledThreadMessage>
            <StyledThreadMessageHeader>
              <StyledSender>{getSenderName(message)}</StyledSender>
              {isNonEmptyString(message.receivedAt) && (
                <StyledSecondaryText>
                  {beautifyPastDateRelativeToNow(
                    message.receivedAt,
                    localeCatalog,
                  )}
                </StyledSecondaryText>
              )}
            </StyledThreadMessageHeader>
            {isOpen && <EventCardMessageEnvelope message={message} />}
            <EventCardMessageBody
              body={message.text}
              isOpen={isOpen}
              snippetLineClamp={1}
              notSharedByFullName={notSharedByFullName}
            />
          </StyledThreadMessage>
        </Fragment>
      ))}
    </StyledEventCardMessageContainer>
  );
};
