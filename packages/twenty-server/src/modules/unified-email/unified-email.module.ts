import { Module } from '@nestjs/common';

import { WorkspaceIteratorModule } from 'src/database/commands/command-runners/workspace-iterator.module';
import { CacheLockModule } from 'src/engine/core-modules/cache-lock/cache-lock.module';
import { WorkspaceCacheModule } from 'src/engine/workspace-cache/workspace-cache.module';
import { FindOrCreateEmailContactsCommand } from 'src/modules/unified-email/commands/find-or-create-email-contacts.command';
import { RecordTestSentEmailCommand } from 'src/modules/unified-email/commands/record-test-sent-email.command';
import { EmailTrackingController } from 'src/modules/unified-email/controllers/email-tracking.controller';
import { EmailTrackingEventJob } from 'src/modules/unified-email/jobs/email-tracking-event.job';
import { EmailTimelineService } from 'src/modules/unified-email/services/email-timeline.service';
import { EmailTrackingService } from 'src/modules/unified-email/services/email-tracking.service';
import { EmailDerivedFieldsJob } from 'src/modules/unified-email/jobs/email-derived-fields.job';
import { EmailDerivedFieldsListener } from 'src/modules/unified-email/listeners/email-derived-fields.listener';
import { EmailContactFindOrCreateService } from 'src/modules/unified-email/services/email-contact-find-or-create.service';
import { EmailRecordService } from 'src/modules/unified-email/services/email-record.service';
import { SentEmailRecorderService } from 'src/modules/unified-email/services/sent-email-recorder.service';

@Module({
  imports: [CacheLockModule, WorkspaceIteratorModule, WorkspaceCacheModule],
  controllers: [EmailTrackingController],
  providers: [
    EmailDerivedFieldsJob,
    EmailDerivedFieldsListener,
    EmailContactFindOrCreateService,
    EmailRecordService,
    SentEmailRecorderService,
    EmailTrackingService,
    EmailTimelineService,
    EmailTrackingEventJob,
    FindOrCreateEmailContactsCommand,
    RecordTestSentEmailCommand,
  ],
  exports: [
    FindOrCreateEmailContactsCommand,
    RecordTestSentEmailCommand,
    EmailContactFindOrCreateService,
    EmailRecordService,
    SentEmailRecorderService,
    EmailTrackingService,
    EmailTimelineService,
  ],
})
export class UnifiedEmailModule {}
