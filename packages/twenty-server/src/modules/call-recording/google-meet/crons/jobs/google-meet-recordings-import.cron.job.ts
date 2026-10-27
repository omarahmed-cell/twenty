import { InjectRepository } from '@nestjs/typeorm';

import { ConnectedAccountProvider } from 'twenty-shared/types';
import { WorkspaceActivationStatus } from 'twenty-shared/workspace';
import { IsNull, Repository } from 'typeorm';

import { SentryCronMonitor } from 'src/engine/core-modules/cron/sentry-cron-monitor.decorator';
import { InjectMessageQueue } from 'src/engine/core-modules/message-queue/decorators/message-queue.decorator';
import { Process } from 'src/engine/core-modules/message-queue/decorators/process.decorator';
import { Processor } from 'src/engine/core-modules/message-queue/decorators/processor.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';
import { CalendarChannelEntity } from 'src/engine/metadata-modules/calendar-channel/entities/calendar-channel.entity';
import {
  GoogleMeetRecordingsImportJob,
  type GoogleMeetRecordingsImportJobData,
} from 'src/modules/call-recording/google-meet/jobs/google-meet-recordings-import.job';

export const GOOGLE_MEET_RECORDINGS_IMPORT_CRON_PATTERN = '15 * * * *';

// Meet attaches recordings, transcripts and Gemini notes some minutes after a call, so a week covers late files
const GOOGLE_MEET_RECORDINGS_LOOKBACK_DAYS = 7;

@Processor({ queueName: MessageQueue.cronQueue })
export class GoogleMeetRecordingsImportCronJob {
  constructor(
    @InjectMessageQueue(MessageQueue.calendarQueue)
    private readonly messageQueueService: MessageQueueService,
    @InjectRepository(CalendarChannelEntity)
    private readonly calendarChannelRepository: Repository<CalendarChannelEntity>,
  ) {}

  @Process(GoogleMeetRecordingsImportCronJob.name)
  @SentryCronMonitor(
    GoogleMeetRecordingsImportCronJob.name,
    GOOGLE_MEET_RECORDINGS_IMPORT_CRON_PATTERN,
  )
  async handle(): Promise<void> {
    const calendarChannels = await this.calendarChannelRepository.find({
      select: { workspaceId: true, connectedAccountId: true },
      where: {
        isSyncEnabled: true,
        connectedAccount: { provider: ConnectedAccountProvider.GOOGLE },
        workspace: {
          activationStatus: WorkspaceActivationStatus.ACTIVE,
          deletedAt: IsNull(),
        },
      },
    });

    const workspaceIdByConnectedAccountId = new Map(
      calendarChannels.map(({ workspaceId, connectedAccountId }) => [
        connectedAccountId,
        workspaceId,
      ]),
    );

    for (const [
      connectedAccountId,
      workspaceId,
    ] of workspaceIdByConnectedAccountId) {
      await this.messageQueueService.add<GoogleMeetRecordingsImportJobData>(
        GoogleMeetRecordingsImportJob.name,
        {
          workspaceId,
          connectedAccountId,
          lookbackDays: GOOGLE_MEET_RECORDINGS_LOOKBACK_DAYS,
        },
      );
    }
  }
}
