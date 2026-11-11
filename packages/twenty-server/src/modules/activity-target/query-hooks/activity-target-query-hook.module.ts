import { Module } from '@nestjs/common';

import { CalendarEventCompanyTimelineService } from 'src/modules/activity-target/calendar-event-target/calendar-event-company-timeline.service';
import { CalendarEventTargetCompanyCascadeJob } from 'src/modules/activity-target/calendar-event-target/calendar-event-target-company-cascade.job';
import { CalendarEventTargetCompanyCascadeListener } from 'src/modules/activity-target/calendar-event-target/calendar-event-target-company-cascade.listener';
import { ActivityTargetCompanyCascadeService } from 'src/modules/activity-target/query-hooks/activity-target-company-cascade.service';
import { TimelineActivityModule } from 'src/modules/timeline/timeline-activity.module';
import { NoteTargetCreateOnePostQueryHook } from 'src/modules/activity-target/query-hooks/note-target-create-one.post-query.hook';
import { NoteTargetCreateManyPostQueryHook } from 'src/modules/activity-target/query-hooks/note-target-create-many.post-query.hook';
import { TaskTargetCreateOnePostQueryHook } from 'src/modules/activity-target/query-hooks/task-target-create-one.post-query.hook';
import { TaskTargetCreateManyPostQueryHook } from 'src/modules/activity-target/query-hooks/task-target-create-many.post-query.hook';
import { CallTargetCreateOnePostQueryHook } from 'src/modules/activity-target/query-hooks/call-target-create-one.post-query.hook';
import { CallTargetCreateManyPostQueryHook } from 'src/modules/activity-target/query-hooks/call-target-create-many.post-query.hook';
import { CommunicationTargetCreateOnePostQueryHook } from 'src/modules/activity-target/query-hooks/communication-target-create-one.post-query.hook';
import { EmailTargetCreateOnePostQueryHook } from 'src/modules/activity-target/query-hooks/email-target-create-one.post-query.hook';
import { CommunicationTargetCreateManyPostQueryHook } from 'src/modules/activity-target/query-hooks/communication-target-create-many.post-query.hook';
import { EmailTargetCreateManyPostQueryHook } from 'src/modules/activity-target/query-hooks/email-target-create-many.post-query.hook';

@Module({
  imports: [TimelineActivityModule],
  providers: [
    ActivityTargetCompanyCascadeService,
    CalendarEventCompanyTimelineService,
    CalendarEventTargetCompanyCascadeJob,
    CalendarEventTargetCompanyCascadeListener,
    NoteTargetCreateOnePostQueryHook,
    NoteTargetCreateManyPostQueryHook,
    TaskTargetCreateOnePostQueryHook,
    TaskTargetCreateManyPostQueryHook,
    CallTargetCreateOnePostQueryHook,
    CallTargetCreateManyPostQueryHook,
    CommunicationTargetCreateOnePostQueryHook,
    EmailTargetCreateOnePostQueryHook,
    CommunicationTargetCreateManyPostQueryHook,
    EmailTargetCreateManyPostQueryHook,
  ],
})
export class ActivityTargetQueryHookModule {}
