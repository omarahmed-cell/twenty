import { Logger } from '@nestjs/common';

import { Command, CommandRunner } from 'nest-commander';
import { isDefined } from 'twenty-shared/utils';

import { MarketplaceCatalogSyncCronCommand } from 'src/engine/core-modules/application/application-marketplace/crons/commands/marketplace-catalog-sync.cron.command';
import { StaleRegistrationCleanupCronCommand } from 'src/engine/core-modules/application/application-oauth/stale-registration-cleanup/commands/stale-registration-cleanup.cron.command';
import { ApplicationRecurringChargeCronCommand } from 'src/engine/core-modules/billing/app-billing/crons/commands/application-recurring-charge.cron.command';
import { BillingReminderCronCommand } from 'src/engine/core-modules/billing/reminders/crons/commands/billing-reminder.cron.command';
import { CheckEmailingDomainVerificationCronCommand } from 'src/engine/core-modules/emailing-domain/crons/commands/check-emailing-domain-verification.cron.command';
import { EnterpriseKeyValidationCronCommand } from 'src/engine/core-modules/enterprise/cron/command/organization-key-validation.cron.command';
import { EventLogCleanupCronCommand } from 'src/engine/core-modules/event-logs/cleanup/commands/event-log-cleanup.cron.command';
import { PendingFileCleanupCronCommand } from 'src/engine/core-modules/file/file-upload/crons/commands/pending-file-cleanup.cron.command';
import { RotateSigningKeysCronCommand } from 'src/engine/core-modules/jwt/crons/commands/rotate-signing-keys.cron.command';
import { CronTriggerCronCommand } from 'src/engine/core-modules/logic-function/logic-function-trigger/triggers/cron/cron-trigger.cron.command';
import { PendingWakeUpSweepCronCommand } from 'src/engine/core-modules/pending-wake-up/crons/commands/pending-wake-up-sweep.cron.command';
import { AgentCronTriggerCronCommand } from 'src/engine/metadata-modules/ai/ai-agent-trigger/crons/agent-cron-trigger.cron.command';
import { CheckPublicDomainsValidRecordsCronCommand } from 'src/engine/core-modules/public-domain/crons/commands/check-public-domains-valid-records.cron.command';
import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';
import { UserSessionCleanupCronCommand } from 'src/engine/core-modules/user-session/crons/commands/user-session-cleanup.cron.command';
import { CheckCustomDomainValidRecordsCronCommand } from 'src/engine/core-modules/workspace/crons/commands/check-custom-domain-valid-records.cron.command';
import { WebhookSubscriptionRenewalCronCommand } from 'src/modules/connected-account/webhook-subscription-manager/crons/commands/webhook-subscription-renewal.cron.command';
import { EmailingOngoingStaleCronCommand } from 'src/modules/emailing/crons/commands/emailing-ongoing-stale.cron.command';
import { ReconcileCampaignStatsCronCommand } from 'src/modules/emailing/crons/commands/reconcile-campaign-stats.cron.command';
import { TrashCleanupCronCommand } from 'src/engine/trash-cleanup/commands/trash-cleanup.cron.command';
import { DeferredWorkspaceMigrationActionRecoveryCronCommand } from 'src/engine/workspace-manager/workspace-migration/workspace-migration-runner/crons/commands/deferred-workspace-migration-action-recovery.cron.command';
import { CleanOnboardingWorkspacesCronCommand } from 'src/engine/workspace-manager/workspace-cleaner/commands/clean-onboarding-workspaces.cron.command';
import { CleanSuspendedWorkspacesCronCommand } from 'src/engine/workspace-manager/workspace-cleaner/commands/clean-suspended-workspaces.cron.command';
import { CalendarEventListFetchCronCommand } from 'src/modules/calendar/calendar-event-import-manager/crons/commands/calendar-event-list-fetch.cron.command';
import { GoogleMeetRecordingsImportCronCommand } from 'src/modules/call-recording/google-meet/crons/commands/google-meet-recordings-import.cron.command';
import { CalendarEventsImportCronCommand } from 'src/modules/calendar/calendar-event-import-manager/crons/commands/calendar-import.cron.command';
import { CalendarFullResyncCronCommand } from 'src/modules/calendar/calendar-event-import-manager/crons/commands/calendar-full-resync.cron.command';
import { CalendarOngoingStaleCronCommand } from 'src/modules/calendar/calendar-event-import-manager/crons/commands/calendar-ongoing-stale.cron.command';
import { CalendarRelaunchFailedCalendarChannelsCronCommand } from 'src/modules/calendar/calendar-event-import-manager/crons/commands/calendar-relaunch-failed-calendar-channels.cron.command';
import { MessagingMessageListFetchCronCommand } from 'src/modules/messaging/message-import-manager/crons/commands/messaging-message-list-fetch.cron.command';
import { MessagingMessagesImportCronCommand } from 'src/modules/messaging/message-import-manager/crons/commands/messaging-messages-import.cron.command';
import { MessagingOngoingStaleCronCommand } from 'src/modules/messaging/message-import-manager/crons/commands/messaging-ongoing-stale.cron.command';
import { MessagingRelaunchFailedMessageChannelsCronCommand } from 'src/modules/messaging/message-import-manager/crons/commands/messaging-relaunch-failed-message-channels.cron.command';
import { WorkflowCleanWorkflowRunsCronCommand } from 'src/modules/workflow/workflow-runner/workflow-run-queue/cron/command/workflow-clean-workflow-runs.cron.command';
import { WorkflowHandleStaledRunsCronCommand } from 'src/modules/workflow/workflow-runner/workflow-run-queue/cron/command/workflow-handle-staled-runs.cron.command';
import { WorkflowRunEnqueueCronCommand } from 'src/modules/workflow/workflow-runner/workflow-run-queue/cron/command/workflow-run-enqueue.cron.command';
import { WorkflowCronTriggerCronCommand } from 'src/modules/workflow/workflow-trigger/automated-trigger/crons/commands/workflow-cron-trigger.cron.command';
import { FieldFormulaTimeBasedCronCommand } from 'src/modules/field-formula/crons/commands/field-formula-time-based.cron.command';
import { CompanyCalculatedFieldsNightlyCronCommand } from 'src/modules/company-calculated-fields/crons/commands/company-calculated-fields-nightly.cron.command';
import { CompanyPastMeetingsCronCommand } from 'src/modules/company-calculated-fields/crons/commands/company-past-meetings.cron.command';
import { OpportunityCalculatedFieldsNightlyCronCommand } from 'src/modules/opportunity-calculated-fields/crons/commands/opportunity-calculated-fields-nightly.cron.command';
import { PersonCalculatedFieldsNightlyCronCommand } from 'src/modules/person-calculated-fields/crons/commands/person-calculated-fields-nightly.cron.command';
import { TaskOverdueCronCommand } from 'src/modules/task-calculated-fields/crons/commands/task-overdue.cron.command';
import { RoboostTaskReminderCronCommand } from 'src/modules/roboost-notification/crons/commands/roboost-task-reminder.cron.command';
import { RoboostMergeExpiryCronCommand } from 'src/modules/roboost-merge/crons/roboost-merge-expiry.cron';
import { RoboostNotificationRetentionCronCommand } from 'src/modules/roboost-notification/crons/commands/roboost-notification-retention.cron.command';
import { RoboostScoreVerifyCronCommand } from 'src/modules/roboost-scoring/crons/commands/roboost-score-verify.cron.command';
import { PropertyHistoryTrimCronCommand } from 'src/modules/timeline/crons/commands/property-history-trim.cron.command';
import { EmailReplySyncCronCommand } from 'src/modules/unified-email/crons/commands/email-reply-sync.cron.command';
import { MeetingArtifactsCronCommand } from 'src/modules/meeting/artifacts/crons/commands/meeting-artifacts.cron.command';
import { MeetingCalendarSyncCronCommand } from 'src/modules/meeting/calendar-sync/crons/commands/meeting-calendar-sync.cron.command';

@Command({
  name: 'cron:register:all',
  description: 'Register all background sync cron jobs',
})
export class CronRegisterAllCommand extends CommandRunner {
  private readonly logger = new Logger(CronRegisterAllCommand.name);

  constructor(
    private readonly messagingMessagesImportCronCommand: MessagingMessagesImportCronCommand,
    private readonly messagingMessageListFetchCronCommand: MessagingMessageListFetchCronCommand,
    private readonly messagingOngoingStaleCronCommand: MessagingOngoingStaleCronCommand,
    private readonly messagingRelaunchFailedMessageChannelsCronCommand: MessagingRelaunchFailedMessageChannelsCronCommand,

    private readonly calendarEventListFetchCronCommand: CalendarEventListFetchCronCommand,
    private readonly googleMeetRecordingsImportCronCommand: GoogleMeetRecordingsImportCronCommand,
    private readonly calendarEventsImportCronCommand: CalendarEventsImportCronCommand,
    private readonly calendarOngoingStaleCronCommand: CalendarOngoingStaleCronCommand,
    private readonly calendarRelaunchFailedCalendarChannelsCronCommand: CalendarRelaunchFailedCalendarChannelsCronCommand,
    private readonly calendarFullResyncCronCommand: CalendarFullResyncCronCommand,

    private readonly webhookSubscriptionRenewalCronCommand: WebhookSubscriptionRenewalCronCommand,

    private readonly emailingOngoingStaleCronCommand: EmailingOngoingStaleCronCommand,
    private readonly reconcileCampaignStatsCronCommand: ReconcileCampaignStatsCronCommand,
    private readonly fieldFormulaTimeBasedCronCommand: FieldFormulaTimeBasedCronCommand,
    private readonly companyCalculatedFieldsNightlyCronCommand: CompanyCalculatedFieldsNightlyCronCommand,
    private readonly companyPastMeetingsCronCommand: CompanyPastMeetingsCronCommand,
    private readonly personCalculatedFieldsNightlyCronCommand: PersonCalculatedFieldsNightlyCronCommand,
    private readonly taskOverdueCronCommand: TaskOverdueCronCommand,
    private readonly emailReplySyncCronCommand: EmailReplySyncCronCommand,
    private readonly propertyHistoryTrimCronCommand: PropertyHistoryTrimCronCommand,
    private readonly roboostNotificationRetentionCronCommand: RoboostNotificationRetentionCronCommand,
    private readonly roboostMergeExpiryCronCommand: RoboostMergeExpiryCronCommand,
    private readonly roboostScoreVerifyCronCommand: RoboostScoreVerifyCronCommand,
    private readonly roboostTaskReminderCronCommand: RoboostTaskReminderCronCommand,
    private readonly meetingCalendarSyncCronCommand: MeetingCalendarSyncCronCommand,
    private readonly meetingArtifactsCronCommand: MeetingArtifactsCronCommand,
    private readonly opportunityCalculatedFieldsNightlyCronCommand: OpportunityCalculatedFieldsNightlyCronCommand,

    private readonly workflowCronTriggerCronCommand: WorkflowCronTriggerCronCommand,
    private readonly workflowRunEnqueueCronCommand: WorkflowRunEnqueueCronCommand,
    private readonly workflowHandleStaledRunsCronCommand: WorkflowHandleStaledRunsCronCommand,
    private readonly workflowCleanWorkflowRunsCronCommand: WorkflowCleanWorkflowRunsCronCommand,
    private readonly pendingWakeUpSweepCronCommand: PendingWakeUpSweepCronCommand,

    private readonly checkCustomDomainValidRecordsCronCommand: CheckCustomDomainValidRecordsCronCommand,
    private readonly checkPublicDomainsValidRecordsCronCommand: CheckPublicDomainsValidRecordsCronCommand,
    private readonly checkEmailingDomainVerificationCronCommand: CheckEmailingDomainVerificationCronCommand,
    private readonly cronTriggerCronCommand: CronTriggerCronCommand,
    private readonly agentCronTriggerCronCommand: AgentCronTriggerCronCommand,
    private readonly cleanSuspendedWorkspacesCronCommand: CleanSuspendedWorkspacesCronCommand,
    private readonly cleanOnboardingWorkspacesCronCommand: CleanOnboardingWorkspacesCronCommand,
    private readonly trashCleanupCronCommand: TrashCleanupCronCommand,
    private readonly eventLogCleanupCronCommand: EventLogCleanupCronCommand,
    private readonly enterpriseKeyValidationCronCommand: EnterpriseKeyValidationCronCommand,
    private readonly rotateSigningKeysCronCommand: RotateSigningKeysCronCommand,
    private readonly marketplaceCatalogSyncCronCommand: MarketplaceCatalogSyncCronCommand,
    private readonly staleRegistrationCleanupCronCommand: StaleRegistrationCleanupCronCommand,
    private readonly pendingFileCleanupCronCommand: PendingFileCleanupCronCommand,
    private readonly deferredWorkspaceMigrationActionRecoveryCronCommand: DeferredWorkspaceMigrationActionRecoveryCronCommand,
    private readonly billingReminderCronCommand: BillingReminderCronCommand,
    private readonly applicationRecurringChargeCronCommand: ApplicationRecurringChargeCronCommand,
    private readonly userSessionCleanupCronCommand: UserSessionCleanupCronCommand,
    private readonly twentyConfigService: TwentyConfigService,
  ) {
    super();
  }

  async run(): Promise<void> {
    this.logger.log('Registering all background sync cron jobs...');

    const isSigningKeyAutoRotationEnabled = isDefined(
      this.twentyConfigService.get('SIGNING_KEY_ROTATION_DAYS'),
    );

    const isMarketplaceCatalogSyncEnabled = this.twentyConfigService.get(
      'MARKETPLACE_CATALOG_SYNC_CRON_ENABLED',
    );

    const isBillingEnabled = this.twentyConfigService.get('IS_BILLING_ENABLED');

    const allCommands = [
      {
        name: 'MessagingMessagesImport',
        command: this.messagingMessagesImportCronCommand,
      },
      {
        name: 'MessagingMessageListFetch',
        command: this.messagingMessageListFetchCronCommand,
      },
      {
        name: 'MessagingOngoingStale',
        command: this.messagingOngoingStaleCronCommand,
      },
      {
        name: 'MessagingRelaunchFailedMessageChannels',
        command: this.messagingRelaunchFailedMessageChannelsCronCommand,
      },
      {
        name: 'CalendarEventListFetch',
        command: this.calendarEventListFetchCronCommand,
      },
      {
        name: 'CalendarEventsImport',
        command: this.calendarEventsImportCronCommand,
      },
      {
        name: 'GoogleMeetRecordingsImport',
        command: this.googleMeetRecordingsImportCronCommand,
      },
      {
        name: 'CalendarOngoingStale',
        command: this.calendarOngoingStaleCronCommand,
      },
      {
        name: 'CalendarRelaunchFailedCalendarChannels',
        command: this.calendarRelaunchFailedCalendarChannelsCronCommand,
      },
      {
        name: 'CalendarFullResync',
        command: this.calendarFullResyncCronCommand,
      },
      {
        name: 'WebhookSubscriptionRenewal',
        command: this.webhookSubscriptionRenewalCronCommand,
      },
      {
        name: 'EmailingOngoingStale',
        command: this.emailingOngoingStaleCronCommand,
      },
      {
        name: 'FieldFormulaTimeBased',
        command: this.fieldFormulaTimeBasedCronCommand,
      },
      {
        name: 'CompanyCalculatedFieldsNightly',
        command: this.companyCalculatedFieldsNightlyCronCommand,
      },
      {
        name: 'CompanyPastMeetings',
        command: this.companyPastMeetingsCronCommand,
      },
      {
        name: 'PersonCalculatedFieldsNightly',
        command: this.personCalculatedFieldsNightlyCronCommand,
      },
      {
        name: 'TaskOverdue',
        command: this.taskOverdueCronCommand,
      },
      {
        name: 'RoboostTaskReminders',
        command: this.roboostTaskReminderCronCommand,
      },
      {
        name: 'RoboostNotificationRetention',
        command: this.roboostNotificationRetentionCronCommand,
      },
      {
        name: 'RoboostMergeExpiry',
        command: this.roboostMergeExpiryCronCommand,
      },
      {
        name: 'RoboostScoreVerify',
        command: this.roboostScoreVerifyCronCommand,
      },
      {
        name: 'PropertyHistoryTrim',
        command: this.propertyHistoryTrimCronCommand,
      },
      {
        name: 'EmailReplySync',
        command: this.emailReplySyncCronCommand,
      },
      {
        name: 'MeetingCalendarSync',
        command: this.meetingCalendarSyncCronCommand,
      },
      {
        name: 'MeetingArtifacts',
        command: this.meetingArtifactsCronCommand,
      },
      {
        name: 'OpportunityCalculatedFieldsNightly',
        command: this.opportunityCalculatedFieldsNightlyCronCommand,
      },
      {
        name: 'ReconcileCampaignStats',
        command: this.reconcileCampaignStatsCronCommand,
      },
      {
        name: 'CheckCustomDomainValidRecords',
        command: this.checkCustomDomainValidRecordsCronCommand,
      },
      {
        name: 'CheckPublicDomainsValidRecords',
        command: this.checkPublicDomainsValidRecordsCronCommand,
      },
      {
        name: 'CheckEmailingDomainVerification',
        command: this.checkEmailingDomainVerificationCronCommand,
      },
      {
        name: 'WorkflowCronTrigger',
        command: this.workflowCronTriggerCronCommand,
      },
      {
        name: 'WorkflowRunEnqueue',
        command: this.workflowRunEnqueueCronCommand,
      },
      {
        name: 'WorkflowHandleStaledRuns',
        command: this.workflowHandleStaledRunsCronCommand,
      },
      {
        name: 'WorkflowCleanWorkflowRuns',
        command: this.workflowCleanWorkflowRunsCronCommand,
      },
      {
        name: 'PendingWakeUpSweep',
        command: this.pendingWakeUpSweepCronCommand,
      },
      {
        name: 'CronTrigger',
        command: this.cronTriggerCronCommand,
      },
      {
        name: 'AgentCronTrigger',
        command: this.agentCronTriggerCronCommand,
      },
      {
        name: 'CleanSuspendedWorkspaces',
        command: this.cleanSuspendedWorkspacesCronCommand,
      },
      {
        name: 'CleanOnboardingWorkspaces',
        command: this.cleanOnboardingWorkspacesCronCommand,
      },
      {
        name: 'TrashCleanup',
        command: this.trashCleanupCronCommand,
      },
      {
        name: 'EventLogCleanup',
        command: this.eventLogCleanupCronCommand,
      },
      {
        name: 'MarketplaceCatalogSync',
        command: this.marketplaceCatalogSyncCronCommand,
        isEnabled: isMarketplaceCatalogSyncEnabled,
      },
      {
        name: 'EnterpriseKeyValidation',
        command: this.enterpriseKeyValidationCronCommand,
      },
      {
        name: 'RotateSigningKeys',
        command: this.rotateSigningKeysCronCommand,
        isEnabled: isSigningKeyAutoRotationEnabled,
      },
      {
        name: 'StaleRegistrationCleanup',
        command: this.staleRegistrationCleanupCronCommand,
      },
      {
        name: 'PendingFileCleanup',
        command: this.pendingFileCleanupCronCommand,
      },
      {
        name: 'DeferredWorkspaceMigrationActionRecovery',
        command: this.deferredWorkspaceMigrationActionRecoveryCronCommand,
      },
      {
        name: 'BillingReminder',
        command: this.billingReminderCronCommand,
        isEnabled: isBillingEnabled,
      },
      {
        name: 'ApplicationRecurringCharge',
        command: this.applicationRecurringChargeCronCommand,
        isEnabled: isBillingEnabled,
      },
      {
        name: 'UserSessionCleanup',
        command: this.userSessionCleanupCronCommand,
      },
    ];

    let successCount = 0;
    let failureCount = 0;
    const failures: string[] = [];
    const successes: string[] = [];
    const skipped: string[] = [];

    for (const { name, command, isEnabled = true } of allCommands) {
      if (!isEnabled) {
        this.logger.log(`Skipping ${name} cron job (disabled by config)`);
        skipped.push(name);
        continue;
      }

      try {
        this.logger.log(`Registering ${name} cron job...`);
        await command.run();
        this.logger.log(`Successfully registered ${name} cron job`);
        successCount++;
        successes.push(name);
      } catch (error) {
        this.logger.error(`Failed to register ${name} cron job:`, error);
        failureCount++;
        failures.push(name);
      }
    }

    this.logger.log(
      `Cron job registration completed: ${successCount} successful, ${failureCount} failed, ${skipped.length} skipped`,
    );

    if (failures.length > 0) {
      this.logger.warn(`Failed commands: ${failures.join(', ')}`);
    }

    if (successCount > 0) {
      this.logger.log(`Successful commands: ${successes.join(', ')}`);
    }

    if (skipped.length > 0) {
      this.logger.log(`Skipped commands: ${skipped.join(', ')}`);
    }
  }
}
