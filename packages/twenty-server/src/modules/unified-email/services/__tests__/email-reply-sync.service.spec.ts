import { EmailReplySyncService } from 'src/modules/unified-email/services/email-reply-sync.service';

const threadsGet = jest.fn();

jest.mock('googleapis', () => ({
  google: { gmail: () => ({ users: { threads: { get: threadsGet } } }) },
}));

const WORKSPACE_ID = '20202020-1c25-4d02-bf25-6aeccf7ea419';

const gmailMessage = ({
  id,
  from,
  messageId,
  internalDate,
}: {
  id: string;
  from: string;
  messageId: string;
  internalDate: string;
}) => ({
  id,
  threadId: 'thread-1',
  historyId: '1',
  internalDate,
  labelIds: ['INBOX'],
  payload: {
    mimeType: 'text/plain',
    headers: [
      { name: 'From', value: from },
      { name: 'To', value: 'rep@roboost.app' },
      { name: 'Subject', value: 'Re: Pricing' },
      { name: 'Message-ID', value: messageId },
    ],
    body: { data: Buffer.from('Sounds good').toString('base64') },
  },
});

const buildService = () => {
  const queries: string[] = [];
  const coreDataSource = {
    query: jest.fn(async (sql: string) => {
      queries.push(sql);

      if (sql.includes('GROUP BY "gmailThreadId"')) {
        return [
          {
            gmailThreadId: 'thread-1',
            originalEmailId: 'email-original',
            loggedById: 'member-1',
            knownGmailMessageIds: ['msg-1'],
            knownRfcMessageIds: ['<m1@acme.com>'],
          },
        ];
      }

      if (sql.includes('"connectedAccount"')) {
        return [
          {
            id: 'account-1',
            handle: 'rep@roboost.app',
            scopes: ['https://www.googleapis.com/auth/gmail.readonly'],
          },
        ];
      }

      if (sql.includes('"emailTarget"')) {
        return [
          {
            targetPersonId: 'person-1',
            targetCompanyId: null,
            targetOpportunityId: null,
            targetServiceId: null,
          },
          {
            targetPersonId: null,
            targetCompanyId: 'company-1',
            targetOpportunityId: null,
            targetServiceId: null,
          },
        ];
      }

      return [];
    }),
  };
  const emailRecordService = {
    createEmailRecord: jest.fn(async () => ({
      emailId: 'email-reply',
      isDuplicate: false,
    })),
  };
  const emailTimelineService = { addRowsForEmail: jest.fn(async () => 2) };

  const service = new EmailReplySyncService(
    coreDataSource as never,
    { get: () => 90 } as never,
    { getClient: async () => ({}) } as never,
    emailRecordService as never,
    emailTimelineService as never,
    {
      isInternalAddress: (address: string) => address.endsWith('@roboost.app'),
    } as never,
  );

  return { service, queries, emailRecordService, emailTimelineService };
};

describe('EmailReplySyncService', () => {
  beforeEach(() => threadsGet.mockReset());

  it('records only new messages of logged threads, counts inbound replies and adds a timeline row', async () => {
    threadsGet.mockResolvedValue({
      data: {
        messages: [
          gmailMessage({
            id: 'msg-1',
            from: 'rep@roboost.app',
            messageId: '<m1@acme.com>',
            internalDate: '1795000000000',
          }),
          gmailMessage({
            id: 'msg-2',
            from: 'Ann <ann@acme.com>',
            messageId: '<m2@acme.com>',
            internalDate: '1795000100000',
          }),
        ],
      },
    });
    const { service, queries, emailRecordService, emailTimelineService } =
      buildService();

    const summary = await service.syncWorkspace(WORKSPACE_ID);

    expect(threadsGet).toHaveBeenCalledTimes(1);
    expect(threadsGet).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'thread-1' }),
    );
    expect(summary).toEqual({
      threadsChecked: 1,
      threadsSkippedNoAccount: 0,
      repliesCreated: 1,
    });
    expect(emailRecordService.createEmailRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        direction: 'INCOMING',
        source: 'REPLY_SYNC',
        gmailMessageId: 'msg-2',
        rfcMessageId: '<m2@acme.com>',
        links: {
          personIds: ['person-1'],
          companyIds: ['company-1'],
          opportunityIds: [],
          serviceIds: [],
        },
        skipEventEmission: true,
      }),
    );
    expect(queries.some((sql) => sql.includes('"replyCount" = COALESCE'))).toBe(
      true,
    );
    expect(emailTimelineService.addRowsForEmail).toHaveBeenCalledTimes(1);
  });

  it('never reads a thread when the member has no Gmail read access', async () => {
    const { service } = buildService();

    jest
      .spyOn(service as never, 'findGoogleAccount' as never)
      .mockResolvedValue(null as never);

    const summary = await service.syncWorkspace(WORKSPACE_ID);

    expect(threadsGet).not.toHaveBeenCalled();
    expect(summary.threadsSkippedNoAccount).toBe(1);
  });
});
