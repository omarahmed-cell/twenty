import { Module } from '@nestjs/common';

import { MeetingCreateOnePreQueryHook } from 'src/modules/meeting/query-hooks/meeting-create-one.pre-query.hook';
import { MeetingCreateManyPreQueryHook } from 'src/modules/meeting/query-hooks/meeting-create-many.pre-query.hook';
import { MeetingUpdateOnePreQueryHook } from 'src/modules/meeting/query-hooks/meeting-update-one.pre-query.hook';
import { MeetingUpdateManyPreQueryHook } from 'src/modules/meeting/query-hooks/meeting-update-many.pre-query.hook';
import { MeetingDeleteManyPostQueryHook } from 'src/modules/meeting/query-hooks/meeting-delete-many.post-query.hook';
import { MeetingDeleteOnePostQueryHook } from 'src/modules/meeting/query-hooks/meeting-delete-one.post-query.hook';
import { MeetingPostQueryHookService } from 'src/modules/meeting/query-hooks/meeting-post-query-hook.service';
import { MeetingRestoreManyPostQueryHook } from 'src/modules/meeting/query-hooks/meeting-restore-many.post-query.hook';
import { MeetingRestoreOnePostQueryHook } from 'src/modules/meeting/query-hooks/meeting-restore-one.post-query.hook';

@Module({
  providers: [
    MeetingPostQueryHookService,
    MeetingCreateOnePreQueryHook,
    MeetingCreateManyPreQueryHook,
    MeetingUpdateOnePreQueryHook,
    MeetingUpdateManyPreQueryHook,
    MeetingDeleteManyPostQueryHook,
    MeetingDeleteOnePostQueryHook,
    MeetingRestoreManyPostQueryHook,
    MeetingRestoreOnePostQueryHook,
  ],
})
export class MeetingQueryHookModule {}
