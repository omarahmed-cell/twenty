import { Logger, Scope } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';

import { isDefined } from 'twenty-shared/utils';
import { DataSource } from 'typeorm';

import { Process } from 'src/engine/core-modules/message-queue/decorators/process.decorator';
import { Processor } from 'src/engine/core-modules/message-queue/decorators/processor.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { WorkspaceOrmManager } from 'src/engine/twenty-orm/workspace-orm.manager';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
import { getWorkspaceSchemaName } from 'src/engine/workspace-datasource/utils/get-workspace-schema-name.util';
import { EMAIL_TIMELINE_ACTIVITY_TYPE_UNIVERSAL_IDENTIFIERS } from 'src/modules/unified-email/constants/email-timeline-activity-type-universal-identifiers.constant';
import { EmailContactFindOrCreateService } from 'src/modules/unified-email/services/email-contact-find-or-create.service';
import { EmailTimelineService } from 'src/modules/unified-email/services/email-timeline.service';
import { parseEmailAddressList } from 'src/modules/unified-email/utils/format-email-address-list.util';
import { classifyEmailTrackingRequest } from 'src/modules/unified-email/utils/classify-email-tracking-request.util';
import { isSameUtcDay } from 'src/modules/unified-email/utils/is-same-utc-day.util';

export type EmailTrackingEventJobData = {
  workspaceId: string;
  emailId: string;
  type: 'OPEN' | 'CLICK';
  url?: string;
  userAgent: string | null;
  hasSenderSession: boolean;
  occurredAt: string;
};

type EmailTrackingState = {
  id: string;
  sentAt: string | null;
  lastOpenedAt: string | null;
  to: string | null;
};

@Processor({ queueName: MessageQueue.workspaceQueue, scope: Scope.REQUEST })
export class EmailTrackingEventJob {
  private readonly logger = new Logger(EmailTrackingEventJob.name);

  constructor(
    private readonly workspaceOrmManager: WorkspaceOrmManager,
    @InjectDataSource()
    private readonly coreDataSource: DataSource,
    private readonly emailTimelineService: EmailTimelineService,
    private readonly emailContactFindOrCreateService: EmailContactFindOrCreateService,
  ) {}

  @Process(EmailTrackingEventJob.name)
  async handle(data: EmailTrackingEventJobData): Promise<void> {
    const schemaName = getWorkspaceSchemaName(data.workspaceId);
    const [email]: EmailTrackingState[] = await this.coreDataSource.query(
      `SELECT id, "sentAt", "lastOpenedAt", "to" FROM "${schemaName}"."email" WHERE id = $1 AND "deletedAt" IS NULL`,
      [data.emailId],
    );

    if (!isDefined(email)) {
      this.logger.log(`Tracking event for unknown email ${data.emailId}`);

      return;
    }

    const occurredAt = new Date(data.occurredAt);
    const classification = classifyEmailTrackingRequest({
      type: data.type,
      userAgent: data.userAgent,
      hasSenderSession: data.hasSenderSession,
      occurredAt,
      sentAt: isDefined(email.sentAt) ? new Date(email.sentAt) : null,
    });

    await this.workspaceOrmManager.executeInWorkspaceContext(async () => {
      const trackingEventRepository = this.workspaceOrmManager.getRepository(
        'emailTrackingEvent',
        { shouldBypassPermissionChecks: true },
        { shouldSkipEventEmission: true },
      );

      await trackingEventRepository.insert({
        emailId: email.id,
        type: data.type,
        url: data.url ?? null,
        occurredAt: occurredAt.toISOString(),
        userAgent: data.userAgent?.slice(0, 1000) ?? null,
        ...classification,
      });

      if (!classification.isCounted) {
        return;
      }

      const isOpen = data.type === 'OPEN';

      await this.coreDataSource.query(
        isOpen
          ? `UPDATE "${schemaName}"."email" SET "openCount" = COALESCE("openCount", 0) + 1,
              "firstOpenedAt" = COALESCE("firstOpenedAt", $2), "lastOpenedAt" = $2 WHERE id = $1`
          : `UPDATE "${schemaName}"."email" SET "clickCount" = COALESCE("clickCount", 0) + 1,
              "lastClickedAt" = $2 WHERE id = $1`,
        [email.id, occurredAt.toISOString()],
      );

      // Opens add a timeline row at most once a day per email; the date still moves on every open
      const shouldAddTimelineRow =
        !isOpen ||
        !isDefined(email.lastOpenedAt) ||
        !isSameUtcDay(new Date(email.lastOpenedAt), occurredAt);

      if (shouldAddTimelineRow) {
        // The pixel can't tell which recipient opened, so the row names the first one
        const [firstRecipient] = parseEmailAddressList(email.to);

        await this.emailTimelineService.addRowsForEmail({
          actorName: isDefined(firstRecipient)
            ? await this.emailContactFindOrCreateService.getDisplayName(
                data.workspaceId,
                firstRecipient,
              )
            : 'Recipient',
          workspaceId: data.workspaceId,
          emailId: email.id,
          timelineActivityTypeUniversalIdentifier: isOpen
            ? EMAIL_TIMELINE_ACTIVITY_TYPE_UNIVERSAL_IDENTIFIERS.emailOpened
            : EMAIL_TIMELINE_ACTIVITY_TYPE_UNIVERSAL_IDENTIFIERS.emailLinkClicked,
          happensAt: occurredAt,
          properties: isOpen ? {} : { url: data.url },
        });
      }
    }, buildSystemAuthContext(data.workspaceId));
  }
}
