import { Module } from '@nestjs/common';

import { WorkspaceIteratorModule } from 'src/database/commands/command-runners/workspace-iterator.module';
import { AddCalendarEventSharingIndexesCommand } from 'src/database/commands/upgrade-version-command/2-49/2-49-workspace-command-1792153151454-add-calendar-event-sharing-indexes.command';
import { RepairRelationForeignKeyOnDeleteCommand } from 'src/database/commands/upgrade-version-command/2-49/2-49-workspace-command-1792167273000-repair-relation-foreign-key-on-delete.command';
import { StripDerivedRecordFilterPropertiesCommand } from 'src/database/commands/upgrade-version-command/2-49/2-49-workspace-command-1792153804491-strip-derived-record-filter-properties.command';
import { ProvisionActivityObjectsCommand } from 'src/database/commands/upgrade-version-command/2-49/2-49-workspace-command-1792864328886-provision-activity-objects.command';
import { ProvisionCatalogObjectsCommand } from 'src/database/commands/upgrade-version-command/2-49/2-49-workspace-command-1792956108196-provision-catalog-objects.command';
import { MoveLineOfItemTabCommand } from 'src/database/commands/upgrade-version-command/2-49/2-49-workspace-command-1792968069375-move-line-of-item-tab.command';
import { ProvisionMeetingFieldsCommand } from 'src/database/commands/upgrade-version-command/2-49/2-49-workspace-command-1793022325268-provision-meeting-fields.command';
import { ProvisionCallRecordingLinkCommand } from 'src/database/commands/upgrade-version-command/2-49/2-49-workspace-command-1793050711844-provision-call-recording-link.command';
import { ProvisionCallRecordingNotesLinkCommand } from 'src/database/commands/upgrade-version-command/2-49/2-49-workspace-command-1793095789249-provision-call-recording-notes-link.command';
import { ProvisionMeetingNavigationCommand } from 'src/database/commands/upgrade-version-command/2-49/2-49-workspace-command-1793095921551-provision-meeting-navigation.command';
import { ProvisionSegmentsCommand } from 'src/database/commands/upgrade-version-command/2-49/2-49-workspace-command-1793188101860-provision-segments.command';
import { ProvisionSegmentPullCommand } from 'src/database/commands/upgrade-version-command/2-49/2-49-workspace-command-1793359696206-provision-segment-pull.command';
import { ProvisionOpportunityContactsCommand } from 'src/database/commands/upgrade-version-command/2-49/2-49-workspace-command-1794324498712-provision-opportunity-contacts.command';
import { ProvisionEmailsCommand } from 'src/database/commands/upgrade-version-command/2-49/2-49-workspace-command-1794400000000-provision-emails.command';
import { RemoveOutOfHorizonAndInternalCalendarEventsCommand } from 'src/database/commands/upgrade-version-command/2-49/2-49-workspace-command-1794410000000-remove-out-of-horizon-and-internal-calendar-events.command';
import { LockMessageChannelContactAutoCreationCommand } from 'src/database/commands/upgrade-version-command/2-49/2-49-workspace-command-1794500000000-lock-message-channel-contact-auto-creation.command';
import { ProvisionCompanyCalculatedFieldsCommand } from 'src/database/commands/upgrade-version-command/2-49/2-49-workspace-command-1794600000000-provision-company-calculated-fields.command';
import { ProvisionPersonFieldsCommand } from 'src/database/commands/upgrade-version-command/2-49/2-49-workspace-command-1794757116582-provision-person-fields.command';
import { ProvisionDealFieldsCommand } from 'src/database/commands/upgrade-version-command/2-49/2-49-workspace-command-1794778290530-provision-deal-fields.command';
import { ProvisionPipelinesCommand } from 'src/database/commands/upgrade-version-command/2-49/2-49-workspace-command-1794785676065-provision-pipelines.command';
import { ProvisionDealStageHistoryCommand } from 'src/database/commands/upgrade-version-command/2-49/2-49-workspace-command-1794840628348-provision-deal-stage-history.command';
import { ProvisionMeetingSourceAndLocationTypesCommand } from 'src/database/commands/upgrade-version-command/2-49/2-49-workspace-command-1794853579951-provision-meeting-source-and-location-types.command';
import { ProvisionPropertiesModuleCommand } from 'src/database/commands/upgrade-version-command/2-49/2-49-workspace-command-1794880490836-provision-properties-module.command';
import { AddActorSourceValuesCommand } from 'src/database/commands/upgrade-version-command/2-49/2-49-workspace-command-1794924166804-add-actor-source-values.command';
import { ProvisionServicesPipelineCommand } from 'src/database/commands/upgrade-version-command/2-49/2-49-workspace-command-1794924198517-provision-services-pipeline.command';
import { ProvisionRecordSourceCommand } from 'src/database/commands/upgrade-version-command/2-49/2-49-workspace-command-1794924282319-provision-record-source.command';
import { ProvisionActivityAssignedToCommand } from 'src/database/commands/upgrade-version-command/2-49/2-49-workspace-command-1794933094490-provision-activity-assigned-to.command';
import { ProvisionWorkspaceMemberAccessCommand } from 'src/database/commands/upgrade-version-command/2-49/2-49-workspace-command-1794943307202-provision-workspace-member-access.command';
import { ProvisionTaskAndNoteFieldsCommand } from 'src/database/commands/upgrade-version-command/2-49/2-49-workspace-command-1795011565106-provision-task-and-note-fields.command';
import { ProvisionEmailRecordPageFieldsCommand } from 'src/database/commands/upgrade-version-command/2-49/2-49-workspace-command-1795091235333-provision-email-record-page-fields.command';
import { ProvisionRecordLayoutCommand } from 'src/database/commands/upgrade-version-command/2-49/2-49-workspace-command-1795360703833-provision-record-layout.command';
import { ProvisionMeetingsCommand } from 'src/database/commands/upgrade-version-command/2-49/2-49-workspace-command-1795400000000-provision-meetings.command';
import { CopyCalendarEventsToMeetingsCommand } from 'src/database/commands/upgrade-version-command/2-49/2-49-workspace-command-1795400000001-copy-calendar-events-to-meetings.command';
import { TurnOffNativeCalendarSyncCommand } from 'src/database/commands/upgrade-version-command/2-49/2-49-workspace-command-1795400000003-turn-off-native-calendar-sync.command';
import { CreateRoboostTaskReminderTableCommand } from 'src/database/commands/upgrade-version-command/2-49/2-49-workspace-command-1795545310151-create-roboost-task-reminder-table.command';
import { CreateRoboostScoreTablesCommand } from 'src/database/commands/upgrade-version-command/2-49/2-49-workspace-command-1795562107009-create-roboost-score-tables.command';
import { CreateRoboostUserPermissionTablesCommand } from 'src/database/commands/upgrade-version-command/2-49/2-49-workspace-command-1795615751436-create-roboost-user-permission-tables.command';
import { ProvisionUsersAndTeamsCommand } from 'src/database/commands/upgrade-version-command/2-49/2-49-workspace-command-1795614564967-provision-users-and-teams.command';
import { CreateRoboostDataTransferTablesCommand } from 'src/database/commands/upgrade-version-command/2-49/2-49-workspace-command-1795544772205-create-roboost-data-transfer-tables.command';
import { CreateRoboostNotificationTableCommand } from 'src/database/commands/upgrade-version-command/2-49/2-49-workspace-command-1795541802255-create-roboost-notification-table.command';
import { SplitFieldHistoryPerPropertyCommand } from 'src/database/commands/upgrade-version-command/2-49/2-49-workspace-command-1795521311364-split-field-history-per-property.command';
import { RemoveCalculatedFieldTimelineRowsCommand } from 'src/database/commands/upgrade-version-command/2-49/2-49-workspace-command-1795483935348-remove-calculated-field-timeline-rows.command';
import { RemoveLegacyCalendarEventMeetingFieldsCommand } from 'src/database/commands/upgrade-version-command/2-49/2-49-workspace-command-1795400000002-remove-legacy-calendar-event-meeting-fields.command';
import { ProvisionActivityPinCommand } from 'src/database/commands/upgrade-version-command/2-49/2-49-workspace-command-1795388001616-provision-activity-pin.command';
import { ProvisionEmailReplySyncCommand } from 'src/database/commands/upgrade-version-command/2-49/2-49-workspace-command-1795044442993-provision-email-reply-sync.command';
import { ProvisionEmailTrackingCommand } from 'src/database/commands/upgrade-version-command/2-49/2-49-workspace-command-1795036985356-provision-email-tracking.command';
import { ProvisionUnifiedEmailFieldsCommand } from 'src/database/commands/upgrade-version-command/2-49/2-49-workspace-command-1795034153621-provision-unified-email-fields.command';
import { FieldMetadataModule } from 'src/engine/metadata-modules/field-metadata/field-metadata.module';
import { PipelineModule } from 'src/modules/pipeline/pipeline.module';
import { DeleteMorphRelationTargetReferencesCommand } from 'src/database/commands/upgrade-version-command/2-49/2-49-workspace-command-1792154485777-delete-morph-relation-target-references.command';
import { ApplicationModule } from 'src/engine/core-modules/application/application.module';
import { WorkspaceSchemaManagerModule } from 'src/engine/twenty-orm/workspace-schema-manager/workspace-schema-manager.module';
import { WorkspaceCacheModule } from 'src/engine/workspace-cache/workspace-cache.module';
import { WorkspaceMigrationModule } from 'src/engine/workspace-manager/workspace-migration/workspace-migration.module';

@Module({
  imports: [
    ApplicationModule,
    FieldMetadataModule,
    PipelineModule,
    WorkspaceCacheModule,
    WorkspaceIteratorModule,
    WorkspaceMigrationModule,
    WorkspaceSchemaManagerModule,
  ],
  providers: [
    AddCalendarEventSharingIndexesCommand,
    StripDerivedRecordFilterPropertiesCommand,
    DeleteMorphRelationTargetReferencesCommand,
    RepairRelationForeignKeyOnDeleteCommand,
    ProvisionActivityObjectsCommand,
    ProvisionCatalogObjectsCommand,
    MoveLineOfItemTabCommand,
    ProvisionMeetingFieldsCommand,
    ProvisionCallRecordingLinkCommand,
    ProvisionCallRecordingNotesLinkCommand,
    ProvisionMeetingNavigationCommand,
    ProvisionSegmentsCommand,
    ProvisionSegmentPullCommand,
    ProvisionOpportunityContactsCommand,
    ProvisionEmailsCommand,
    RemoveOutOfHorizonAndInternalCalendarEventsCommand,
    LockMessageChannelContactAutoCreationCommand,
    ProvisionCompanyCalculatedFieldsCommand,
    ProvisionPersonFieldsCommand,
    ProvisionDealFieldsCommand,
    ProvisionPipelinesCommand,
    ProvisionDealStageHistoryCommand,
    ProvisionMeetingSourceAndLocationTypesCommand,
    ProvisionPropertiesModuleCommand,
    AddActorSourceValuesCommand,
    ProvisionServicesPipelineCommand,
    ProvisionRecordSourceCommand,
    ProvisionActivityAssignedToCommand,
    ProvisionWorkspaceMemberAccessCommand,
    ProvisionTaskAndNoteFieldsCommand,
    ProvisionUnifiedEmailFieldsCommand,
    ProvisionEmailTrackingCommand,
    ProvisionEmailReplySyncCommand,
    ProvisionEmailRecordPageFieldsCommand,
    ProvisionRecordLayoutCommand,
    ProvisionActivityPinCommand,
    ProvisionMeetingsCommand,
    CopyCalendarEventsToMeetingsCommand,
    RemoveLegacyCalendarEventMeetingFieldsCommand,
    TurnOffNativeCalendarSyncCommand,
    RemoveCalculatedFieldTimelineRowsCommand,
    SplitFieldHistoryPerPropertyCommand,
    CreateRoboostNotificationTableCommand,
    CreateRoboostDataTransferTablesCommand,
    CreateRoboostTaskReminderTableCommand,
    CreateRoboostScoreTablesCommand,
    ProvisionUsersAndTeamsCommand,
    CreateRoboostUserPermissionTablesCommand,
  ],
})
export class V2_49_UpgradeVersionCommandModule {}
