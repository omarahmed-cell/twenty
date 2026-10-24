import { Module } from '@nestjs/common';

import { ActivityTargetCompanyCascadeService } from 'src/modules/activity-target/query-hooks/activity-target-company-cascade.service';
import { NoteTargetCreateOnePostQueryHook } from 'src/modules/activity-target/query-hooks/note-target-create-one.post-query.hook';
import { NoteTargetCreateManyPostQueryHook } from 'src/modules/activity-target/query-hooks/note-target-create-many.post-query.hook';
import { TaskTargetCreateOnePostQueryHook } from 'src/modules/activity-target/query-hooks/task-target-create-one.post-query.hook';
import { TaskTargetCreateManyPostQueryHook } from 'src/modules/activity-target/query-hooks/task-target-create-many.post-query.hook';
import { CallTargetCreateOnePostQueryHook } from 'src/modules/activity-target/query-hooks/call-target-create-one.post-query.hook';
import { CallTargetCreateManyPostQueryHook } from 'src/modules/activity-target/query-hooks/call-target-create-many.post-query.hook';
import { CommunicationTargetCreateOnePostQueryHook } from 'src/modules/activity-target/query-hooks/communication-target-create-one.post-query.hook';
import { CommunicationTargetCreateManyPostQueryHook } from 'src/modules/activity-target/query-hooks/communication-target-create-many.post-query.hook';

@Module({
  providers: [
    ActivityTargetCompanyCascadeService,
    NoteTargetCreateOnePostQueryHook,
    NoteTargetCreateManyPostQueryHook,
    TaskTargetCreateOnePostQueryHook,
    TaskTargetCreateManyPostQueryHook,
    CallTargetCreateOnePostQueryHook,
    CallTargetCreateManyPostQueryHook,
    CommunicationTargetCreateOnePostQueryHook,
    CommunicationTargetCreateManyPostQueryHook,
  ],
})
export class ActivityTargetQueryHookModule {}
