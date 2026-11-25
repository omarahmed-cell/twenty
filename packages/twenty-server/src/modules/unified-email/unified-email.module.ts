import { RoboostRecordVisibilityModule } from 'src/engine/metadata-modules/role/roboost-record-visibility.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { WorkspaceIteratorModule } from 'src/database/commands/command-runners/workspace-iterator.module';
import { FeatureFlagModule } from 'src/engine/core-modules/feature-flag/feature-flag.module';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { OAuth2ClientManagerModule } from 'src/modules/connected-account/oauth2-client-manager/oauth2-client-manager.module';
import { EmailReplySyncCommand } from 'src/modules/unified-email/commands/email-reply-sync.command';
import { EmailReplySyncCronCommand } from 'src/modules/unified-email/crons/commands/email-reply-sync.cron.command';
import { EmailReplySyncCronJob } from 'src/modules/unified-email/crons/jobs/email-reply-sync.cron.job';
import { EmailReplySyncService } from 'src/modules/unified-email/services/email-reply-sync.service';
import { KeyValuePairEntity } from 'src/engine/core-modules/key-value-pair/key-value-pair.entity';
import { GmailExtensionTokenCommand } from 'src/modules/unified-email/commands/gmail-extension-token.command';
import { GmailExtensionController } from 'src/modules/unified-email/gmail-extension/controllers/gmail-extension.controller';
import { GmailExtensionTokenResolver } from 'src/modules/unified-email/gmail-extension/resolvers/gmail-extension-token.resolver';
import { GmailExtensionLogService } from 'src/modules/unified-email/gmail-extension/services/gmail-extension-log.service';
import { GmailExtensionLookupService } from 'src/modules/unified-email/gmail-extension/services/gmail-extension-lookup.service';
import { GmailExtensionTokenService } from 'src/modules/unified-email/gmail-extension/services/gmail-extension-token.service';
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
  imports: [
    RoboostRecordVisibilityModule,
    CacheLockModule,
    WorkspaceIteratorModule,
    WorkspaceCacheModule,
    TypeOrmModule.forFeature([KeyValuePairEntity, WorkspaceEntity]),
    FeatureFlagModule,
    OAuth2ClientManagerModule,
  ],
  controllers: [EmailTrackingController, GmailExtensionController],
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
    GmailExtensionTokenCommand,
    GmailExtensionTokenService,
    GmailExtensionTokenResolver,
    GmailExtensionLookupService,
    GmailExtensionLogService,
    EmailReplySyncService,
    EmailReplySyncCronJob,
    EmailReplySyncCronCommand,
    EmailReplySyncCommand,
  ],
  exports: [
    EmailReplySyncCronCommand,
    EmailReplySyncCommand,
    GmailExtensionTokenCommand,
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
