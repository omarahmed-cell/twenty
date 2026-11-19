import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';

import { isNonEmptyString } from '@sniptt/guards';
import { type gmail_v1, google } from 'googleapis';
import { FieldActorSource } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import { DataSource } from 'typeorm';

import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';
import { getWorkspaceSchemaName } from 'src/engine/workspace-datasource/utils/get-workspace-schema-name.util';
import { GoogleOAuth2ClientProvider } from 'src/modules/connected-account/oauth2-client-manager/drivers/google/google-oauth2-client.provider';
import { getPropertyFromHeaders } from 'src/modules/messaging/message-import-manager/drivers/gmail/utils/get-property-from-headers.util';
import { parseGmailMessage } from 'src/modules/messaging/message-import-manager/drivers/gmail/utils/parse-gmail-message.util';
import { EMAIL_TIMELINE_ACTIVITY_TYPE_UNIVERSAL_IDENTIFIERS } from 'src/modules/unified-email/constants/email-timeline-activity-type-universal-identifiers.constant';
import { EmailContactFindOrCreateService } from 'src/modules/unified-email/services/email-contact-find-or-create.service';
import { EmailRecordService } from 'src/modules/unified-email/services/email-record.service';
import { EmailTimelineService } from 'src/modules/unified-email/services/email-timeline.service';
import { hasGmailReadScope } from 'src/modules/unified-email/utils/has-gmail-read-scope.util';

type LoggedThread = {
  gmailThreadId: string;
  originalEmailId: string;
  loggedById: string | null;
  knownGmailMessageIds: string[];
  knownRfcMessageIds: string[];
};

type TargetRow = {
  targetPersonId: string | null;
  targetCompanyId: string | null;
  targetOpportunityId: string | null;
  targetServiceId: string | null;
};

type GoogleAccount = { id: string; handle: string; scopes: string[] | null };

export type ReplySyncSummary = {
  threadsChecked: number;
  threadsSkippedNoAccount: number;
  repliesCreated: number;
};

@Injectable()
export class EmailReplySyncService {
  private readonly logger = new Logger(EmailReplySyncService.name);

  constructor(
    @InjectDataSource()
    private readonly coreDataSource: DataSource,
    private readonly twentyConfigService: TwentyConfigService,
    private readonly googleOAuth2ClientProvider: GoogleOAuth2ClientProvider,
    private readonly emailRecordService: EmailRecordService,
    private readonly emailTimelineService: EmailTimelineService,
    private readonly emailContactFindOrCreateService: EmailContactFindOrCreateService,
  ) {}

  // Only threads someone logged are read, and only while they had a message in the last N days
  async findLoggedThreads(workspaceId: string): Promise<LoggedThread[]> {
    const schemaName = getWorkspaceSchemaName(workspaceId);
    const maxIdleDays = this.twentyConfigService.get(
      'UNIFIED_EMAIL_REPLY_SYNC_MAX_IDLE_DAYS',
    );

    return this.coreDataSource.query(
      `SELECT "gmailThreadId",
        (array_agg(id ORDER BY "sentAt" ASC NULLS LAST, "createdAt" ASC))[1] AS "originalEmailId",
        (array_agg("loggedById" ORDER BY "sentAt" ASC NULLS LAST) FILTER (WHERE "loggedById" IS NOT NULL))[1] AS "loggedById",
        array_remove(array_agg("gmailMessageId"), NULL) AS "knownGmailMessageIds",
        array_remove(array_agg("rfcMessageId"), NULL) AS "knownRfcMessageIds"
      FROM "${schemaName}"."email"
      WHERE "deletedAt" IS NULL AND "gmailThreadId" IS NOT NULL
      GROUP BY "gmailThreadId"
      HAVING max(COALESCE("sentAt", "createdAt")) > now() - make_interval(days => $1)`,
      [maxIdleDays],
    );
  }

  private async findGoogleAccount(
    workspaceId: string,
    workspaceMemberId: string,
  ): Promise<GoogleAccount | null> {
    const schemaName = getWorkspaceSchemaName(workspaceId);
    const accounts: GoogleAccount[] = await this.coreDataSource.query(
      `SELECT account.id, account.handle, account.scopes
      FROM "core"."connectedAccount" account
      JOIN "core"."userWorkspace" user_workspace ON user_workspace.id = account."userWorkspaceId"
      JOIN "${schemaName}"."workspaceMember" member ON member."userId" = user_workspace."userId"
      WHERE member.id = $1 AND account."workspaceId" = $2 AND account.provider = 'google'
        AND account."authFailedAt" IS NULL
      ORDER BY account."createdAt"`,
      [workspaceMemberId, workspaceId],
    );

    return accounts.find(({ scopes }) => hasGmailReadScope(scopes)) ?? null;
  }

  async syncWorkspace(workspaceId: string): Promise<ReplySyncSummary> {
    const summary: ReplySyncSummary = {
      threadsChecked: 0,
      threadsSkippedNoAccount: 0,
      repliesCreated: 0,
    };

    for (const thread of await this.findLoggedThreads(workspaceId)) {
      const account = isDefined(thread.loggedById)
        ? await this.findGoogleAccount(workspaceId, thread.loggedById)
        : null;

      if (!isDefined(account)) {
        summary.threadsSkippedNoAccount += 1;
        continue;
      }

      try {
        summary.repliesCreated += await this.syncThread(
          workspaceId,
          thread,
          account,
        );
        summary.threadsChecked += 1;
      } catch (error) {
        this.logger.warn(
          `Workspace ${workspaceId}: thread ${thread.gmailThreadId} not synced: ${(error as Error).message}`,
        );
      }
    }

    if (summary.threadsSkippedNoAccount > 0) {
      this.logger.log(
        `Workspace ${workspaceId}: ${summary.threadsSkippedNoAccount} logged thread(s) skipped, their member has no Google account with Gmail read access`,
      );
    }

    return summary;
  }

  async syncThread(
    workspaceId: string,
    thread: LoggedThread,
    account: GoogleAccount,
  ): Promise<number> {
    const auth = await this.googleOAuth2ClientProvider.getClient(account.id);
    const gmail = google.gmail({ version: 'v1', auth });
    const { data } = await gmail.users.threads.get({
      userId: 'me',
      id: thread.gmailThreadId,
      format: 'full',
    });

    const knownGmailIds = new Set(thread.knownGmailMessageIds);
    const knownRfcIds = new Set(thread.knownRfcMessageIds);
    const newMessages = (data.messages ?? []).filter((message) => {
      const rfcMessageId = getPropertyFromHeaders(message, 'Message-ID');

      return (
        isDefined(message.id) &&
        !knownGmailIds.has(message.id) &&
        !(isNonEmptyString(rfcMessageId) && knownRfcIds.has(rfcMessageId)) &&
        !(message.labelIds ?? []).includes('DRAFT')
      );
    });

    if (newMessages.length === 0) {
      return 0;
    }

    const links = await this.getThreadLinks(workspaceId, thread.gmailThreadId);
    let created = 0;

    for (const message of newMessages) {
      if (
        await this.createReply(workspaceId, thread, account, message, links)
      ) {
        created += 1;
      }
    }

    return created;
  }

  private async getThreadLinks(workspaceId: string, gmailThreadId: string) {
    const schemaName = getWorkspaceSchemaName(workspaceId);
    const rows: TargetRow[] = await this.coreDataSource.query(
      `SELECT DISTINCT target."targetPersonId", target."targetCompanyId", target."targetOpportunityId", target."targetServiceId"
      FROM "${schemaName}"."emailTarget" target
      JOIN "${schemaName}"."email" email ON email.id = target."emailId"
      WHERE email."gmailThreadId" = $1 AND email."deletedAt" IS NULL AND target."deletedAt" IS NULL`,
      [gmailThreadId],
    );

    const collect = (column: keyof TargetRow) => [
      ...new Set(rows.map((row) => row[column]).filter(isDefined)),
    ];

    return {
      personIds: collect('targetPersonId'),
      companyIds: collect('targetCompanyId'),
      opportunityIds: collect('targetOpportunityId'),
      serviceIds: collect('targetServiceId'),
    };
  }

  private async createReply(
    workspaceId: string,
    thread: LoggedThread,
    account: GoogleAccount,
    message: gmail_v1.Schema$Message,
    links: Awaited<ReturnType<EmailReplySyncService['getThreadLinks']>>,
  ): Promise<boolean> {
    const parsed = parseGmailMessage(message);
    const fromAddress = parsed.from?.address ?? '';
    const isOutbound =
      fromAddress.toLowerCase() === account.handle.toLowerCase() ||
      this.emailContactFindOrCreateService.isInternalAddress(fromAddress);
    const sentAt = new Date(Number(parsed.internalDate));
    const toInputs = (addresses: { address?: string; name?: string }[]) =>
      addresses
        .filter((address) => isNonEmptyString(address.address))
        .map((address) => ({
          address: address.address as string,
          displayName: address.name ?? null,
        }));

    const { emailId, isDuplicate } =
      await this.emailRecordService.createEmailRecord({
        workspaceId,
        direction: isOutbound ? 'OUTGOING' : 'INCOMING',
        source: 'REPLY_SYNC',
        status: 'SENT',
        sentAt,
        subject: parsed.subject ?? null,
        bodyHtml: parsed.isHtml ? parsed.body : null,
        bodyMarkdown: parsed.isHtml ? null : parsed.body,
        from: isDefined(parsed.from)
          ? { address: fromAddress, displayName: parsed.from.name ?? null }
          : null,
        to: toInputs(parsed.to),
        cc: toInputs(parsed.cc),
        bcc: toInputs(parsed.bcc),
        gmailMessageId: parsed.id,
        gmailThreadId: thread.gmailThreadId,
        rfcMessageId: parsed.headerMessageId ?? null,
        inReplyTo: getPropertyFromHeaders(message, 'In-Reply-To') ?? null,
        loggedByWorkspaceMemberId: thread.loggedById,
        createdBy: {
          source: FieldActorSource.EMAIL,
          name: 'Reply sync',
          workspaceMemberId: null,
          context: {},
        },
        links,
        skipEventEmission: true,
      });

    if (isDuplicate) {
      return false;
    }

    // A reply is something the other side wrote; the rep's own follow-ups are recorded but not counted
    if (!isOutbound) {
      const schemaName = getWorkspaceSchemaName(workspaceId);

      await this.coreDataSource.query(
        `UPDATE "${schemaName}"."email" SET "replyCount" = COALESCE("replyCount", 0) + 1,
          "repliedAt" = GREATEST(COALESCE("repliedAt", $2), $2)
        WHERE id = $1`,
        [thread.originalEmailId, sentAt.toISOString()],
      );
    }

    await this.emailTimelineService.addRowsForEmail({
      actorName: isOutbound
        ? ((isDefined(thread.loggedById)
            ? await this.emailContactFindOrCreateService.getWorkspaceMemberName(
                workspaceId,
                thread.loggedById,
              )
            : null) ?? fromAddress)
        : await this.emailContactFindOrCreateService.getDisplayName(
            workspaceId,
            { address: fromAddress, displayName: parsed.from?.name ?? null },
          ),
      workspaceId,
      emailId,
      timelineActivityTypeUniversalIdentifier:
        EMAIL_TIMELINE_ACTIVITY_TYPE_UNIVERSAL_IDENTIFIERS.emailReplied,
      happensAt: sentAt,
      properties: { direction: isOutbound ? 'OUTGOING' : 'INCOMING' },
    });

    return true;
  }
}
