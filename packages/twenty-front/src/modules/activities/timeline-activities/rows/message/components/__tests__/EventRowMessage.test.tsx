import { CombinedGraphQLErrors } from '@apollo/client/errors';
import { i18n } from '@lingui/core';
import { I18nProvider } from '@lingui/react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FIELD_RESTRICTED_ADDITIONAL_PERMISSIONS_REQUIRED } from 'twenty-shared/constants';
import { MessageParticipantRole } from 'twenty-shared/types';

import { useTimelineChannelOwnerName } from '@/activities/timeline-activities/hooks/useTimelineChannelOwnerName';
import { EventRowMessage } from '@/activities/timeline-activities/rows/message/components/EventRowMessage';
import { type TimelineMessage } from '@/activities/timeline-activities/rows/message/types/TimelineMessage';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { useFindOneRecord } from '@/object-record/hooks/useFindOneRecord';

jest.mock('@/object-record/hooks/useFindOneRecord', () => ({
  useFindOneRecord: jest.fn(),
}));
jest.mock('@/object-record/hooks/useFindManyRecords', () => ({
  useFindManyRecords: jest.fn(),
}));
jest.mock(
  '@/activities/timeline-activities/hooks/useTimelineChannelOwnerName',
  () => ({ useTimelineChannelOwnerName: jest.fn() }),
);
jest.mock('@/side-panel/hooks/useOpenRecordInSidePanel', () => ({
  useOpenRecordInSidePanel: () => ({ openRecordInSidePanel: jest.fn() }),
}));
jest.mock(
  '@/activities/timeline-activities/rows/components/EventRowDate',
  () => ({ EventRowDate: () => null }),
);
jest.mock('@/ui/utilities/state/jotai/hooks/useAtomStateValue', () => ({
  useAtomStateValue: () => ({ localeCatalog: undefined }),
}));

const buildMessage = ({
  id,
  text,
  direction,
  senderName,
  senderHandle,
  recipientHandle,
  receivedAt,
}: {
  id: string;
  text: string;
  direction: 'INCOMING' | 'OUTGOING';
  senderName: string;
  senderHandle: string;
  recipientHandle: string;
  receivedAt: string;
}): TimelineMessage =>
  ({
    id,
    subject: 'Pricing follow-up',
    text,
    receivedAt,
    isDraft: false,
    messageThreadId: 'thread-id',
    messageParticipants: [
      {
        id: `${id}-from`,
        role: MessageParticipantRole.FROM,
        handle: senderHandle,
        displayName: senderName,
      },
      {
        id: `${id}-to`,
        role: MessageParticipantRole.TO,
        handle: recipientHandle,
        displayName: recipientHandle,
      },
    ],
    messageChannelMessageAssociations: [
      { id: `${id}-association`, messageChannelId: 'channel-id', direction },
    ],
    __typename: 'Message',
  }) as TimelineMessage;

const sentMessage = buildMessage({
  id: 'sent-id',
  text: 'Here is our pricing.',
  direction: 'OUTGOING',
  senderName: 'Omar Ahmed',
  senderHandle: 'omar@roboost.app',
  recipientHandle: 'lead@acme.com',
  receivedAt: '2026-10-27T10:00:00.000Z',
});

const replyMessage = buildMessage({
  id: 'reply-id',
  text: 'Thanks, looks good.',
  direction: 'INCOMING',
  senderName: 'Lena Lead',
  senderHandle: 'lead@acme.com',
  recipientHandle: 'omar@roboost.app',
  receivedAt: '2026-10-27T11:00:00.000Z',
});

const mockRecords = ({
  message,
  threadMessages = [],
  error,
}: {
  message?: TimelineMessage;
  threadMessages?: TimelineMessage[];
  error?: Error;
}) => {
  jest.mocked(useFindOneRecord).mockReturnValue({
    record: message,
    loading: false,
    error,
  } as never);
  jest
    .mocked(useFindManyRecords)
    .mockReturnValue({ records: threadMessages } as never);
};

const renderRow = (messageId = 'sent-id') =>
  render(
    <I18nProvider i18n={i18n}>
      <EventRowMessage
        messageId={messageId}
        authorFullName="Ada Lovelace"
        happensAt="2026-10-27T10:00:00.000Z"
      />
    </I18nProvider>,
  );

describe('EventRowMessage', () => {
  beforeEach(() => {
    jest.mocked(useTimelineChannelOwnerName).mockReturnValue({
      getChannelOwnerName: () => 'Omar Ahmed',
    });
  });

  it('attributes a sent email to the rep who owns the mailbox', () => {
    mockRecords({ message: sentMessage, threadMessages: [sentMessage] });

    renderRow();

    expect(screen.getByText('Omar Ahmed')).toBeInTheDocument();
    expect(screen.getByText('sent an email')).toBeInTheDocument();
    expect(screen.getByText('Pricing follow-up')).toBeInTheDocument();
    expect(
      screen.getByText('To: lead@acme.com', { exact: false }),
    ).toBeInTheDocument();
    expect(screen.getByText('Here is our pricing.')).toBeInTheDocument();
  });

  it('reads a received email as coming from the contact', () => {
    mockRecords({ message: replyMessage, threadMessages: [replyMessage] });

    renderRow('reply-id');

    expect(
      screen.getByText('received an email from Lena Lead'),
    ).toBeInTheDocument();
  });

  it('shows a reply as an email replies entry that expands to the full thread', async () => {
    const user = userEvent.setup();
    const middleMessage = buildMessage({
      id: 'middle-id',
      text: 'One more question.',
      direction: 'INCOMING',
      senderName: 'Lena Lead',
      senderHandle: 'lead@acme.com',
      recipientHandle: 'omar@roboost.app',
      receivedAt: '2026-10-27T10:30:00.000Z',
    });

    mockRecords({
      message: replyMessage,
      threadMessages: [sentMessage, middleMessage, replyMessage],
    });

    renderRow('reply-id');

    expect(
      screen.getByText('received a reply from Lena Lead'),
    ).toBeInTheDocument();
    expect(screen.getByText('Email replies (3)')).toBeInTheDocument();
    expect(screen.getByText('Here is our pricing.')).toBeInTheDocument();
    expect(screen.getByText('Thanks, looks good.')).toBeInTheDocument();
    expect(screen.getByText('1 more in between')).toBeInTheDocument();
    expect(screen.queryByText('One more question.')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Expand details' }));

    expect(screen.getByText('One more question.')).toBeInTheDocument();
    expect(screen.queryByText('1 more in between')).not.toBeInTheDocument();
  });

  it('does not render fields masked by metadata visibility', () => {
    mockRecords({
      message: {
        ...sentMessage,
        subject: FIELD_RESTRICTED_ADDITIONAL_PERMISSIONS_REQUIRED,
        text: FIELD_RESTRICTED_ADDITIONAL_PERMISSIONS_REQUIRED,
      },
    });

    renderRow();

    expect(screen.getByText('Subject not shared')).toBeInTheDocument();
    expect(screen.getByText('Not shared by Ada Lovelace')).toBeInTheDocument();
    expect(
      screen.queryByText(FIELD_RESTRICTED_ADDITIONAL_PERMISSIONS_REQUIRED),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/lead@acme.com/)).not.toBeInTheDocument();
  });

  it('renders the not-shared state when record access is forbidden', () => {
    mockRecords({
      error: new CombinedGraphQLErrors({
        data: null,
        errors: [{ message: 'Forbidden', extensions: { code: 'FORBIDDEN' } }],
      }),
    });

    renderRow();

    expect(screen.getByText('Subject not shared')).toBeInTheDocument();
    expect(screen.getByText('Not shared by Ada Lovelace')).toBeInTheDocument();
  });

  it('fails closed when a hidden record is omitted without an error', () => {
    mockRecords({});

    renderRow();

    expect(screen.getByText('Subject not shared')).toBeInTheDocument();
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });
});
