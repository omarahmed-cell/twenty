import { Injectable, Logger } from '@nestjs/common';

import { FieldActorSource } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

import { type ComposedEmail } from 'src/engine/core-modules/tool/tools/email-tool/types/composed-email.type';
import { type SendMessageResult } from 'src/modules/messaging/message-outbound-manager/types/send-message-result.type';
import { EmailContactFindOrCreateService } from 'src/modules/unified-email/services/email-contact-find-or-create.service';
import {
  type EmailRecordSource,
  EmailRecordService,
} from 'src/modules/unified-email/services/email-record.service';
import { parseEmailAddressList } from 'src/modules/unified-email/utils/format-email-address-list.util';
import { normalizeEmailAddress } from 'src/modules/unified-email/utils/classify-email-address.util';

export type RecordSentEmailInput = {
  workspaceId: string;
  composedEmail: ComposedEmail;
  sendResult?: SendMessageResult;
  deliveryError?: string;
  source: Extract<EmailRecordSource, 'CRM' | 'WORKFLOW' | 'SEQUENCE'>;
  loggedByWorkspaceMemberId?: string | null;
  opportunityIds?: string[];
  personIds?: string[];
  companyIds?: string[];
  emailId?: string;
  trackEnabled?: boolean;
};

const toAddressInputs = (handles: string[]) =>
  handles.flatMap((handle) => parseEmailAddressList(handle));

@Injectable()
export class SentEmailRecorderService {
  private readonly logger = new Logger(SentEmailRecorderService.name);

  constructor(
    private readonly emailRecordService: EmailRecordService,
    private readonly emailContactFindOrCreateService: EmailContactFindOrCreateService,
  ) {}

  // Never throws: the email is already sent, a missing CRM record must not turn that into an error
  async recordSentEmail(input: RecordSentEmailInput): Promise<string | null> {
    try {
      return await this.record(input);
    } catch (error) {
      this.logger.warn(
        `Workspace ${input.workspaceId}: could not record the sent email: ${(error as Error).message}`,
      );

      return null;
    }
  }

  private async record({
    workspaceId,
    composedEmail,
    sendResult,
    deliveryError,
    source,
    loggedByWorkspaceMemberId,
    opportunityIds = [],
    personIds = [],
    companyIds = [],
    emailId,
    trackEnabled,
  }: RecordSentEmailInput): Promise<string | null> {
    const to = toAddressInputs(composedEmail.recipients.to);
    const cc = toAddressInputs(composedEmail.recipients.cc);
    const bcc = toAddressInputs(composedEmail.recipients.bcc);
    const recipients = [...to, ...cc, ...bcc];

    if (
      recipients.length > 0 &&
      recipients.every(({ address }) =>
        this.emailContactFindOrCreateService.isInternalAddress(address),
      )
    ) {
      return null;
    }

    const people =
      await this.emailContactFindOrCreateService.findPeopleByAddresses(
        workspaceId,
        [
          ...new Set(
            recipients.map(({ address }) => normalizeEmailAddress(address)),
          ),
        ],
      );

    const isGmail = composedEmail.connectedAccount.provider === 'google';
    const isFailed = isDefined(deliveryError) || !isDefined(sendResult);

    const { emailId: recordedEmailId } =
      await this.emailRecordService.createEmailRecord({
        workspaceId,
        emailId,
        direction: 'OUTGOING',
        source,
        status: isFailed ? 'FAILED' : 'SENT',
        sentAt: new Date(),
        subject: composedEmail.sanitizedSubject,
        bodyHtml: composedEmail.sanitizedHtmlBody,
        bodyMarkdown: composedEmail.plainTextBody,
        from: {
          address:
            composedEmail.fromHandle ?? composedEmail.connectedAccount.handle,
        },
        to,
        cc,
        bcc,
        gmailMessageId: isGmail
          ? (sendResult?.messageExternalId ?? null)
          : null,
        gmailThreadId: isGmail ? (sendResult?.threadExternalId ?? null) : null,
        rfcMessageId: sendResult?.headerMessageId ?? null,
        inReplyTo: composedEmail.inReplyTo ?? null,
        trackEnabled: trackEnabled ?? false,
        deliveryError: deliveryError ?? null,
        loggedByWorkspaceMemberId: loggedByWorkspaceMemberId ?? null,
        createdBy: {
          source:
            source === 'WORKFLOW'
              ? FieldActorSource.WORKFLOW
              : FieldActorSource.MANUAL,
          name: source === 'WORKFLOW' ? 'Workflow' : 'Email',
          workspaceMemberId: loggedByWorkspaceMemberId ?? null,
          context: {},
        },
        links: {
          opportunityIds,
          personIds: [...personIds, ...people.map(({ id }) => id)],
          companyIds: [
            ...companyIds,
            ...people.map(({ companyId }) => companyId).filter(isDefined),
          ],
        },
      });

    return recordedEmailId;
  }
}
