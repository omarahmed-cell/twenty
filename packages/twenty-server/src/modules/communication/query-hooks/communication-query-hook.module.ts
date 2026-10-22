import { Module } from '@nestjs/common';

import { CommunicationDeleteManyPostQueryHook } from 'src/modules/communication/query-hooks/communication-delete-many.post-query.hook';
import { CommunicationDeleteOnePostQueryHook } from 'src/modules/communication/query-hooks/communication-delete-one.post-query.hook';
import { CommunicationPostQueryHookService } from 'src/modules/communication/query-hooks/communication-post-query-hook.service';
import { CommunicationRestoreManyPostQueryHook } from 'src/modules/communication/query-hooks/communication-restore-many.post-query.hook';
import { CommunicationRestoreOnePostQueryHook } from 'src/modules/communication/query-hooks/communication-restore-one.post-query.hook';

@Module({
  providers: [
    CommunicationPostQueryHookService,
    CommunicationDeleteManyPostQueryHook,
    CommunicationDeleteOnePostQueryHook,
    CommunicationRestoreManyPostQueryHook,
    CommunicationRestoreOnePostQueryHook,
  ],
})
export class CommunicationQueryHookModule {}
