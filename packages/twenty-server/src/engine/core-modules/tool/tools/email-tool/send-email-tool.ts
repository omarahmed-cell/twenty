import { EmailOperation } from 'twenty-shared/types';
import { Injectable, Logger } from '@nestjs/common';

import { SOURCE_LOCALE } from 'twenty-shared/translations';

import { I18nService } from 'src/engine/core-modules/i18n/i18n.service';
import { EmailComposerService } from 'src/engine/core-modules/tool/tools/email-tool/email-composer.service';
import { EmailToolInputZodSchema } from 'src/engine/core-modules/tool/tools/email-tool/email-tool.schema';
import { EmailToolException } from 'src/engine/core-modules/tool/tools/email-tool/exceptions/email-tool.exception';
import { isInsufficientPermissionsError } from 'src/engine/core-modules/tool/tools/email-tool/utils/is-insufficient-permissions-error.util';
import { type EmailToolInput } from 'src/engine/core-modules/tool/tools/email-tool/types/email-tool-input.type';
import { type ToolOutput } from 'src/engine/core-modules/tool/types/tool-output.type';
import { type ToolExecutionContext } from 'src/engine/core-modules/tool/types/tool-execution-context.type';
import { type Tool } from 'src/engine/core-modules/tool/types/tool.type';
import { SendEmailService } from 'src/modules/messaging/message-outbound-manager/services/send-email.service';
import { EmailTrackingService } from 'src/modules/unified-email/services/email-tracking.service';
import { SentEmailRecorderService } from 'src/modules/unified-email/services/sent-email-recorder.service';
import { v4 } from 'uuid';

@Injectable()
export class SendEmailTool implements Tool {
  private readonly logger = new Logger(SendEmailTool.name);

  description =
    'Send an email using a connected account. Requires SEND_EMAIL_TOOL permission.';
  inputSchema = EmailToolInputZodSchema;

  constructor(
    private readonly emailComposerService: EmailComposerService,
    private readonly sendEmailService: SendEmailService,
    private readonly i18nService: I18nService,
    private readonly sentEmailRecorderService: SentEmailRecorderService,
    private readonly emailTrackingService: EmailTrackingService,
  ) {}

  async execute(
    parameters: EmailToolInput,
    context: ToolExecutionContext,
  ): Promise<ToolOutput> {
    try {
      const result = await this.emailComposerService.composeEmail({
        parameters,
        context,
        operation: EmailOperation.SEND,
      });

      if (!result.success) {
        const errorMessage = this.i18nService
          .getI18nInstance(SOURCE_LOCALE)
          ._(result.error);

        return { success: false, message: errorMessage, error: errorMessage };
      }

      const emailRecordId = v4();
      const data =
        parameters.trackEmail === true
          ? {
              ...result.data,
              sanitizedHtmlBody: this.emailTrackingService.addTrackingToHtml({
                html: result.data.sanitizedHtmlBody,
                workspaceId: context.workspaceId,
                emailId: emailRecordId,
              }),
            }
          : result.data;

      const recordInput = {
        workspaceId: context.workspaceId,
        composedEmail: result.data,
        source:
          context.isWorkflowRun === true
            ? ('WORKFLOW' as const)
            : ('CRM' as const),
        loggedByWorkspaceMemberId:
          context.isWorkflowRun === true
            ? null
            : (context.workspaceMemberId ?? null),
        emailId: emailRecordId,
        trackEnabled: parameters.trackEmail === true,
      };

      let sendResult;

      try {
        sendResult = await this.sendEmailService.sendComposedEmail(data);
      } catch (sendError) {
        await this.sentEmailRecorderService.recordSentEmail({
          ...recordInput,
          deliveryError:
            sendError instanceof Error ? sendError.message : String(sendError),
        });

        throw sendError;
      }

      const recordedEmailId =
        await this.sentEmailRecorderService.recordSentEmail({
          ...recordInput,
          sendResult,
        });

      const persistedMessage = data.shouldPersistMessage
        ? await this.sendEmailService.persistSentMessage(
            sendResult,
            data,
            context.workspaceId,
          )
        : undefined;

      this.logger.log(
        `Email sent successfully to ${data.toRecipientsDisplay}${data.attachments.length > 0 ? ` with ${data.attachments.length} attachments` : ''}`,
      );

      return {
        success: true,
        message: `Email sent successfully to ${data.toRecipientsDisplay}`,
        result: {
          recipients: data.recipients.to,
          ccRecipients: data.recipients.cc,
          bccRecipients: data.recipients.bcc,
          subject: data.sanitizedSubject,
          sanitizedHtmlBody: data.sanitizedHtmlBody,
          plainTextBody: data.plainTextBody,
          connectedAccountId: data.connectedAccount.id,
          attachmentCount: data.attachments.length,
          headerMessageId: sendResult.headerMessageId,
          threadExternalId: sendResult.threadExternalId,
          messageId: persistedMessage?.messageId,
          messageThreadId: persistedMessage?.messageThreadId,
          emailRecordId: recordedEmailId,
        },
      };
    } catch (error) {
      if (error instanceof EmailToolException) {
        return {
          success: false,
          message: 'Failed to send email',
          error: error.message,
        };
      }

      this.logger.error(`Failed to send email: ${error}`);

      if (isInsufficientPermissionsError(error)) {
        return {
          success: false,
          message: 'Failed to send email due to insufficient permissions',
          error:
            'The connected email account does not have permission to send emails.',
        };
      }

      return {
        success: false,
        message: 'Failed to send email',
        error: error instanceof Error ? error.message : 'Failed to send email',
      };
    }
  }
}
