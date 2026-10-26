import { Scope } from '@nestjs/common';

import { Process } from 'src/engine/core-modules/message-queue/decorators/process.decorator';
import { Processor } from 'src/engine/core-modules/message-queue/decorators/processor.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { CalendarEventAssignedToAutoFillService } from 'src/modules/calendar/calendar-event-assigned-to/services/calendar-event-assigned-to-auto-fill.service';

export type CalendarEventAssignedToAutoFillJobData = {
  workspaceId: string;
  calendarEventIds: string[];
};

@Processor({ queueName: MessageQueue.calendarQueue, scope: Scope.REQUEST })
export class CalendarEventAssignedToAutoFillJob {
  constructor(
    private readonly calendarEventAssignedToAutoFillService: CalendarEventAssignedToAutoFillService,
  ) {}

  @Process(CalendarEventAssignedToAutoFillJob.name)
  async handle(data: CalendarEventAssignedToAutoFillJobData): Promise<void> {
    await this.calendarEventAssignedToAutoFillService.autoFillAssignedTo(data);
  }
}
