import { CombinedGraphQLErrors } from '@apollo/client/errors';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { type ReactNode, useState } from 'react';
import { CoreObjectNameSingular } from 'twenty-shared/types';
import { isDefined, isFieldValueRestricted } from 'twenty-shared/utils';

import { useTimelineChannelOwnerName } from '@/activities/timeline-activities/hooks/useTimelineChannelOwnerName';
import { EventRowWithCard } from '@/activities/timeline-activities/rows/components/EventRowWithCard';
import { EventCardEmailReplies } from '@/activities/timeline-activities/rows/message/components/EventCardEmailReplies';
import { EventCardMessage } from '@/activities/timeline-activities/rows/message/components/EventCardMessage';
import { EventCardMessageForbidden } from '@/activities/timeline-activities/rows/message/components/EventCardMessageForbidden';
import { TIMELINE_MESSAGE_GQL_FIELDS } from '@/activities/timeline-activities/rows/message/constants/TimelineMessageGqlFields';
import { type TimelineMessage } from '@/activities/timeline-activities/rows/message/types/TimelineMessage';
import { getTimelineMessageActorAndAction } from '@/activities/timeline-activities/rows/message/utils/getTimelineMessageActorAndAction';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { useFindOneRecord } from '@/object-record/hooks/useFindOneRecord';

const hasGraphQLErrorCode = (error: unknown, code: string) =>
  CombinedGraphQLErrors.is(error) &&
  error.errors.some((graphQLError) => graphQLError.extensions?.code === code);

type EventRowMessageProps = {
  messageId: string;
  authorFullName: string;
  happensAt: string;
};

export const EventRowMessage = ({
  messageId,
  authorFullName,
  happensAt,
}: EventRowMessageProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { getChannelOwnerName } = useTimelineChannelOwnerName();

  const {
    record: message,
    loading,
    error,
  } = useFindOneRecord<TimelineMessage>({
    objectNameSingular: CoreObjectNameSingular.Message,
    objectRecordId: messageId,
    recordGqlFields: TIMELINE_MESSAGE_GQL_FIELDS,
  });

  const { records: threadMessages } = useFindManyRecords<TimelineMessage>({
    objectNameSingular: CoreObjectNameSingular.Message,
    filter: { messageThreadId: { eq: message?.messageThreadId } },
    orderBy: [{ receivedAt: 'AscNullsFirst' }],
    recordGqlFields: TIMELINE_MESSAGE_GQL_FIELDS,
    skip: !isDefined(message?.messageThreadId),
  });

  const fallbackRow = (content: ReactNode) => (
    <EventRowWithCard
      actorName={authorFullName}
      actionLabel={t`sent or received an email`}
      happensAt={happensAt}
      isOpen={false}
    >
      {content}
    </EventRowWithCard>
  );

  if (isDefined(error)) {
    if (hasGraphQLErrorCode(error, 'FORBIDDEN')) {
      return fallbackRow(
        <EventCardMessageForbidden notSharedByFullName={authorFullName} />,
      );
    }

    return fallbackRow(
      hasGraphQLErrorCode(error, 'NOT_FOUND') ? (
        <Trans>Message not found</Trans>
      ) : (
        <Trans>Error loading message</Trans>
      ),
    );
  }

  if (loading) {
    return fallbackRow(<Trans>Loading...</Trans>);
  }

  if (
    !isDefined(message) ||
    [message.subject, message.text].some(isFieldValueRestricted)
  ) {
    return fallbackRow(
      <EventCardMessageForbidden notSharedByFullName={authorFullName} />,
    );
  }

  const sentThreadMessages = threadMessages.filter(
    (threadMessage) => !threadMessage.isDraft,
  );
  const positionInThread = sentThreadMessages.findIndex(
    (threadMessage) => threadMessage.id === message.id,
  );
  const isReply = positionInThread > 0;

  const { actorName, actionLabel } = getTimelineMessageActorAndAction({
    message,
    isReply,
    channelOwnerName: getChannelOwnerName(
      message.messageChannelMessageAssociations.map(
        (association) => association.messageChannelId,
      ),
    ),
  });

  return (
    <EventRowWithCard
      actorName={actorName}
      actionLabel={actionLabel}
      happensAt={happensAt}
      isOpen={isOpen}
      onToggle={setIsOpen}
    >
      {isReply ? (
        <EventCardEmailReplies
          messages={sentThreadMessages.slice(0, positionInThread + 1)}
          isOpen={isOpen}
          notSharedByFullName={actorName}
        />
      ) : (
        <EventCardMessage
          message={message}
          isOpen={isOpen}
          notSharedByFullName={actorName}
        />
      )}
    </EventRowWithCard>
  );
};
