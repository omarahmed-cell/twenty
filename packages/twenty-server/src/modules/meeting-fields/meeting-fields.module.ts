import { Module } from '@nestjs/common';

import { WorkspaceIteratorModule } from 'src/database/commands/command-runners/workspace-iterator.module';
import { BackfillMeetingFieldsCommand } from 'src/modules/meeting-fields/commands/backfill-meeting-fields.command';
import { MeetingFieldsJob } from 'src/modules/meeting-fields/jobs/meeting-fields.job';
import { MeetingFieldsListener } from 'src/modules/meeting-fields/listeners/meeting-fields.listener';
import { CalendarEventCreateOneMeetingFieldsPreQueryHook } from 'src/modules/meeting-fields/query-hooks/calendar-event-create-one-meeting-fields.pre-query.hook';
import { CalendarEventCreateManyMeetingFieldsPreQueryHook } from 'src/modules/meeting-fields/query-hooks/calendar-event-create-many-meeting-fields.pre-query.hook';
import { CalendarEventUpdateOneMeetingFieldsPreQueryHook } from 'src/modules/meeting-fields/query-hooks/calendar-event-update-one-meeting-fields.pre-query.hook';
import { CalendarEventUpdateManyMeetingFieldsPreQueryHook } from 'src/modules/meeting-fields/query-hooks/calendar-event-update-many-meeting-fields.pre-query.hook';
import { MeetingFieldsService } from 'src/modules/meeting-fields/services/meeting-fields.service';

@Module({
  imports: [WorkspaceIteratorModule],
  providers: [
    MeetingFieldsService,
    MeetingFieldsListener,
    MeetingFieldsJob,
    BackfillMeetingFieldsCommand,
    CalendarEventCreateOneMeetingFieldsPreQueryHook,
    CalendarEventCreateManyMeetingFieldsPreQueryHook,
    CalendarEventUpdateOneMeetingFieldsPreQueryHook,
    CalendarEventUpdateManyMeetingFieldsPreQueryHook,
  ],
  exports: [MeetingFieldsService],
})
export class MeetingFieldsModule {}
