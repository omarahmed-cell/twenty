import { Logger, Scope } from '@nestjs/common';

import { Process } from 'src/engine/core-modules/message-queue/decorators/process.decorator';
import { Processor } from 'src/engine/core-modules/message-queue/decorators/processor.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { MeetingGooglePushService } from 'src/modules/meeting/scheduling/services/meeting-google-push.service';

export type MeetingGooglePushJobData = {
  workspaceId: string;
  meetingIds: string[];
};

@Processor({ queueName: MessageQueue.workspaceQueue, scope: Scope.REQUEST })
export class MeetingGooglePushJob {
  private readonly logger = new Logger(MeetingGooglePushJob.name);

  constructor(
    private readonly meetingGooglePushService: MeetingGooglePushService,
  ) {}

  @Process(MeetingGooglePushJob.name)
  async handle({ workspaceId, meetingIds }: MeetingGooglePushJobData) {
    for (const meetingId of meetingIds) {
      try {
        await this.meetingGooglePushService.pushMeeting(workspaceId, meetingId);
      } catch (error) {
        this.logger.warn(
          `Google Calendar refused the update of meeting ${meetingId}: ${(error as Error).message}`,
        );
      }
    }
  }
}
