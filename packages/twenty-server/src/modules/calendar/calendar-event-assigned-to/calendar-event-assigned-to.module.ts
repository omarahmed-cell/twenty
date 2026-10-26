import { Module } from '@nestjs/common';

import { CalendarEventAssignedToAutoFillJob } from 'src/modules/calendar/calendar-event-assigned-to/jobs/calendar-event-assigned-to-auto-fill.job';
import { CalendarEventAssignedToAutoFillListener } from 'src/modules/calendar/calendar-event-assigned-to/listeners/calendar-event-assigned-to-auto-fill.listener';
import { CalendarEventAssignedToAutoFillService } from 'src/modules/calendar/calendar-event-assigned-to/services/calendar-event-assigned-to-auto-fill.service';

@Module({
  providers: [
    CalendarEventAssignedToAutoFillService,
    CalendarEventAssignedToAutoFillJob,
    CalendarEventAssignedToAutoFillListener,
  ],
})
export class CalendarEventAssignedToModule {}
