import { Injectable, Logger } from '@nestjs/common';

import { isNonEmptyString } from '@sniptt/guards';
import { type ActorMetadata } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import { In } from 'typeorm';

import {
  transformHtmlToRichTextValue,
  transformRichTextValue,
} from 'src/engine/core-modules/record-transformer/utils/transform-rich-text.util';
import { WorkspaceOrmManager } from 'src/engine/twenty-orm/workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
import { formatEmailAddressList } from 'src/modules/unified-email/utils/format-email-address-list.util';
import { toBodyPreview } from 'src/modules/unified-email/utils/compute-email-derived-field-updates.util';

export type EmailRecordSource =
  | 'HUBSPOT_IMPORT'
  | 'GMAIL_EXTENSION'
  | 'CRM'
  | 'WORKFLOW'
  | 'SEQUENCE'
  | 'REPLY_SYNC';

export type EmailAddressInput = {
  address: string;
  displayName?: string | null;
};

export type EmailRecordLinks = {
  personIds?: string[];
  companyIds?: string[];
  opportunityIds?: string[];
};

export type CreateEmailRecordInput = {
  workspaceId: string;
  direction: 'INCOMING' | 'OUTGOING';
  source: EmailRecordSource;
  status: 'SENT' | 'SCHEDULED' | 'FAILED' | 'BOUNCED';
  sentAt: Date;
  subject: string | null;
  bodyHtml?: string | null;
  bodyMarkdown?: string | null;
  from: EmailAddressInput | null;
  to: EmailAddressInput[];
  cc?: EmailAddressInput[];
  bcc?: EmailAddressInput[];
  gmailMessageId?: string | null;
  gmailThreadId?: string | null;
  rfcMessageId?: string | null;
  inReplyTo?: string | null;
  trackEnabled?: boolean;
  deliveryError?: string | null;
  loggedByWorkspaceMemberId?: string | null;
  createdBy: ActorMetadata;
  links: EmailRecordLinks;
  emailId?: string;
};

export type EmailRecordResult = { emailId: string; isDuplicate: boolean };

@Injectable()
export class EmailRecordService {
  private readonly logger = new Logger(EmailRecordService.name);

  constructor(private readonly workspaceOrmManager: WorkspaceOrmManager) {}

  async findByMessageIds({
    workspaceId,
    gmailMessageId,
    rfcMessageId,
  }: {
    workspaceId: string;
    gmailMessageId?: string | null;
    rfcMessageId?: string | null;
  }): Promise<{ id: string } | null> {
    if (!isNonEmptyString(gmailMessageId) && !isNonEmptyString(rfcMessageId)) {
      return null;
    }

    return this.workspaceOrmManager.executeInWorkspaceContext(async () => {
      const emailRepository = this.workspaceOrmManager.getRepository('email', {
        shouldBypassPermissionChecks: true,
      });

      if (isNonEmptyString(gmailMessageId)) {
        const byGmailId = await emailRepository.findOne({
          where: { gmailMessageId },
          select: ['id'],
        });

        if (isDefined(byGmailId)) {
          return { id: byGmailId.id as string };
        }
      }

      if (isNonEmptyString(rfcMessageId)) {
        const byRfcId = await emailRepository.findOne({
          where: { rfcMessageId },
          select: ['id'],
        });

        if (isDefined(byRfcId)) {
          return { id: byRfcId.id as string };
        }
      }

      return null;
    }, buildSystemAuthContext(workspaceId));
  }

  async createEmailRecord(
    input: CreateEmailRecordInput,
  ): Promise<EmailRecordResult> {
    const existing = await this.findByMessageIds(input);

    if (isDefined(existing)) {
      await this.addLinks({
        workspaceId: input.workspaceId,
        emailId: existing.id,
        links: input.links,
      });

      return { emailId: existing.id, isDuplicate: true };
    }

    const bodyV2 = isNonEmptyString(input.bodyHtml)
      ? await transformHtmlToRichTextValue(input.bodyHtml)
      : isNonEmptyString(input.bodyMarkdown)
        ? await transformRichTextValue({
            markdown: input.bodyMarkdown,
            blocknote: null,
          })
        : null;

    const emailId = await this.workspaceOrmManager.executeInWorkspaceContext(
      async () => {
        const emailRepository = this.workspaceOrmManager.getRepository(
          'email',
          { shouldBypassPermissionChecks: true },
        );

        const inserted = await emailRepository.insert({
          ...(isDefined(input.emailId) ? { id: input.emailId } : {}),
          subject: input.subject,
          bodyV2,
          bodyPreview: toBodyPreview(bodyV2?.markdown ?? null),
          direction: input.direction,
          source: input.source,
          status: input.status,
          sentAt: input.sentAt.toISOString(),
          from: isDefined(input.from)
            ? formatEmailAddressList([input.from])
            : null,
          to: formatEmailAddressList(input.to),
          cc: formatEmailAddressList(input.cc ?? []),
          bcc: formatEmailAddressList(input.bcc ?? []),
          gmailMessageId: input.gmailMessageId ?? null,
          gmailThreadId: input.gmailThreadId ?? null,
          rfcMessageId: input.rfcMessageId ?? null,
          inReplyTo: input.inReplyTo ?? null,
          trackEnabled: input.trackEnabled ?? false,
          openCount: 0,
          clickCount: 0,
          replyCount: 0,
          deliveryError: input.deliveryError ?? null,
          loggedById: input.loggedByWorkspaceMemberId ?? null,
          createdBy: input.createdBy,
        });

        return inserted.identifiers[0].id as string;
      },
      buildSystemAuthContext(input.workspaceId),
    );

    await this.addLinks({
      workspaceId: input.workspaceId,
      emailId,
      links: input.links,
    });

    return { emailId, isDuplicate: false };
  }

  // Deal links go first: linking a deal also links its company, which must not be inserted twice
  async addLinks({
    workspaceId,
    emailId,
    links,
  }: {
    workspaceId: string;
    emailId: string;
    links: EmailRecordLinks;
  }) {
    await this.workspaceOrmManager.executeInWorkspaceContext(async () => {
      const emailTargetRepository = this.workspaceOrmManager.getRepository(
        'emailTarget',
        { shouldBypassPermissionChecks: true },
      );

      const groups = [
        { column: 'targetOpportunityId', ids: links.opportunityIds ?? [] },
        { column: 'targetPersonId', ids: links.personIds ?? [] },
        { column: 'targetCompanyId', ids: links.companyIds ?? [] },
      ];

      for (const { column, ids } of groups) {
        const uniqueIds = [...new Set(ids.filter(isNonEmptyString))];

        if (uniqueIds.length === 0) {
          continue;
        }

        const existingTargets = await emailTargetRepository.find({
          where: { emailId, [column]: In(uniqueIds) },
        });
        const linkedIds = new Set(
          existingTargets.map(
            (target) => (target as Record<string, unknown>)[column] as string,
          ),
        );

        for (const id of uniqueIds.filter((id) => !linkedIds.has(id))) {
          try {
            await emailTargetRepository.insert({ emailId, [column]: id });
          } catch (error) {
            this.logger.warn(
              `Email ${emailId}: could not link ${column} ${id}: ${(error as Error).message}`,
            );
          }
        }
      }
    }, buildSystemAuthContext(workspaceId));
  }
}
