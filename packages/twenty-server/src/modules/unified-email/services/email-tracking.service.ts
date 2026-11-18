import { Injectable } from '@nestjs/common';

import { InjectMessageQueue } from 'src/engine/core-modules/message-queue/decorators/message-queue.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';
import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';
import {
  EmailTrackingEventJob,
  type EmailTrackingEventJobData,
} from 'src/modules/unified-email/jobs/email-tracking-event.job';
import { addEmailTracking } from 'src/modules/unified-email/utils/add-email-tracking.util';
import {
  decodeEmailTrackingToken,
  encodeEmailTrackingToken,
  type EmailTrackingTokenPayload,
} from 'src/modules/unified-email/utils/email-tracking-token.util';

export type EmailTrackingUrls = {
  openPixelUrl: string;
  buildClickUrl: (url: string) => string;
};

@Injectable()
export class EmailTrackingService {
  constructor(
    private readonly twentyConfigService: TwentyConfigService,
    @InjectMessageQueue(MessageQueue.workspaceQueue)
    private readonly messageQueueService: MessageQueueService,
  ) {}

  private getSecret() {
    return this.twentyConfigService.get('APP_SECRET');
  }

  private getBaseUrl() {
    return this.twentyConfigService
      .get('UNIFIED_EMAIL_TRACKING_BASE_URL')
      .replace(/\/+$/, '');
  }

  buildTrackingUrls({
    workspaceId,
    emailId,
  }: {
    workspaceId: string;
    emailId: string;
  }): EmailTrackingUrls {
    const baseUrl = this.getBaseUrl();
    const secret = this.getSecret();

    return {
      openPixelUrl: `${baseUrl}/o/${encodeEmailTrackingToken({ workspaceId, emailId }, secret)}.gif`,
      buildClickUrl: (url: string) =>
        `${baseUrl}/c/${encodeEmailTrackingToken({ workspaceId, emailId, url }, secret)}`,
    };
  }

  addTrackingToHtml({
    html,
    workspaceId,
    emailId,
  }: {
    html: string;
    workspaceId: string;
    emailId: string;
  }) {
    return addEmailTracking({
      html,
      ...this.buildTrackingUrls({ workspaceId, emailId }),
    });
  }

  decodeToken(token: string): EmailTrackingTokenPayload | null {
    return decodeEmailTrackingToken(
      token.replace(/\.gif$/i, ''),
      this.getSecret(),
    );
  }

  async recordEvent(data: EmailTrackingEventJobData) {
    await this.messageQueueService.add<EmailTrackingEventJobData>(
      EmailTrackingEventJob.name,
      data,
    );
  }
}
