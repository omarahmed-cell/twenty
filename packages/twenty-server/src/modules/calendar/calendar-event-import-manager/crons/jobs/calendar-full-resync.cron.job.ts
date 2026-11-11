import { InjectRepository } from '@nestjs/typeorm';

import groupBy from 'lodash.groupby';
import {
  CalendarChannelSyncStage,
  CalendarChannelSyncStatus,
  ConnectedAccountProvider,
} from 'twenty-shared/types';
import { WorkspaceActivationStatus } from 'twenty-shared/workspace';
import { IsNull, Repository } from 'typeorm';

import { SentryCronMonitor } from 'src/engine/core-modules/cron/sentry-cron-monitor.decorator';
import { ExceptionHandlerService } from 'src/engine/core-modules/exception-handler/exception-handler.service';
import { Process } from 'src/engine/core-modules/message-queue/decorators/process.decorator';
import { Processor } from 'src/engine/core-modules/message-queue/decorators/processor.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { CalendarChannelEntity } from 'src/engine/metadata-modules/calendar-channel/entities/calendar-channel.entity';
import { CalendarChannelSyncStatusService } from 'src/modules/calendar/common/services/calendar-channel-sync-status.service';

export const CALENDAR_FULL_RESYNC_CRON_PATTERN = '0 3 * * 0';

// Google sync tokens cannot carry a time window, so a periodic full sync is what imports
// occurrences that have moved inside CALENDAR_EVENTS_IMPORT_HORIZON_DAYS.
@Processor(MessageQueue.cronQueue)
export class CalendarFullResyncCronJob {
  constructor(
    @InjectRepository(CalendarChannelEntity)
    private readonly calendarChannelRepository: Repository<CalendarChannelEntity>,
    private readonly calendarChannelSyncStatusService: CalendarChannelSyncStatusService,
    private readonly exceptionHandlerService: ExceptionHandlerService,
  ) {}

  @Process(CalendarFullResyncCronJob.name)
  @SentryCronMonitor(
    CalendarFullResyncCronJob.name,
    CALENDAR_FULL_RESYNC_CRON_PATTERN,
  )
  async handle(): Promise<void> {
    const idleGoogleCalendarChannels =
      await this.calendarChannelRepository.find({
        select: { id: true, workspaceId: true },
        where: {
          isSyncEnabled: true,
          syncStatus: CalendarChannelSyncStatus.ACTIVE,
          syncStage: CalendarChannelSyncStage.CALENDAR_EVENT_LIST_FETCH_PENDING,
          connectedAccount: { provider: ConnectedAccountProvider.GOOGLE },
          workspace: {
            activationStatus: WorkspaceActivationStatus.ACTIVE,
            deletedAt: IsNull(),
          },
        },
      });

    const calendarChannelsByWorkspaceId = groupBy(
      idleGoogleCalendarChannels,
      ({ workspaceId }) => workspaceId,
    );

    for (const [workspaceId, calendarChannels] of Object.entries(
      calendarChannelsByWorkspaceId,
    )) {
      try {
        await this.calendarChannelSyncStatusService.resetAndMarkAsCalendarEventListFetchPending(
          calendarChannels.map(({ id }) => id),
          workspaceId,
        );
      } catch (error) {
        this.exceptionHandlerService.captureExceptions([error], {
          workspace: { id: workspaceId },
        });
      }
    }
  }
}
