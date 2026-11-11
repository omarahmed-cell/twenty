import { Module } from '@nestjs/common';

import { EmailDeleteManyPostQueryHook } from 'src/modules/email/query-hooks/email-delete-many.post-query.hook';
import { EmailDeleteOnePostQueryHook } from 'src/modules/email/query-hooks/email-delete-one.post-query.hook';
import { EmailPostQueryHookService } from 'src/modules/email/query-hooks/email-post-query-hook.service';
import { EmailRestoreManyPostQueryHook } from 'src/modules/email/query-hooks/email-restore-many.post-query.hook';
import { EmailRestoreOnePostQueryHook } from 'src/modules/email/query-hooks/email-restore-one.post-query.hook';

@Module({
  providers: [
    EmailPostQueryHookService,
    EmailDeleteManyPostQueryHook,
    EmailDeleteOnePostQueryHook,
    EmailRestoreManyPostQueryHook,
    EmailRestoreOnePostQueryHook,
  ],
})
export class EmailQueryHookModule {}
