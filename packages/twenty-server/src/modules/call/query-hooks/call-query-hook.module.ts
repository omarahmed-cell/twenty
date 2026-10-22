import { Module } from '@nestjs/common';

import { CallDeleteManyPostQueryHook } from 'src/modules/call/query-hooks/call-delete-many.post-query.hook';
import { CallDeleteOnePostQueryHook } from 'src/modules/call/query-hooks/call-delete-one.post-query.hook';
import { CallPostQueryHookService } from 'src/modules/call/query-hooks/call-post-query-hook.service';
import { CallRestoreManyPostQueryHook } from 'src/modules/call/query-hooks/call-restore-many.post-query.hook';
import { CallRestoreOnePostQueryHook } from 'src/modules/call/query-hooks/call-restore-one.post-query.hook';

@Module({
  providers: [
    CallPostQueryHookService,
    CallDeleteManyPostQueryHook,
    CallDeleteOnePostQueryHook,
    CallRestoreManyPostQueryHook,
    CallRestoreOnePostQueryHook,
  ],
})
export class CallQueryHookModule {}
