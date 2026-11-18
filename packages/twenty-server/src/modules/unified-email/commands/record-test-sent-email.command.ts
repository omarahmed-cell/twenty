import { Command, Option } from 'nest-commander';

import {
  ProvisionedWorkspaceCommandRunner,
  type ProvisionedWorkspaceCommandOptions,
} from 'src/database/commands/command-runners/provisioned-workspace.command-runner';
import { WorkspaceIteratorService } from 'src/database/commands/command-runners/workspace-iterator.service';
import { type RunOnWorkspaceArgs } from 'src/database/commands/command-runners/workspace.command-runner';
import { type ComposedEmail } from 'src/engine/core-modules/tool/tools/email-tool/types/composed-email.type';
import { SentEmailRecorderService } from 'src/modules/unified-email/services/sent-email-recorder.service';

type RecordTestSentEmailCommandOptions = ProvisionedWorkspaceCommandOptions & {
  to?: string[];
  subject?: string;
  source?: 'CRM' | 'WORKFLOW';
  opportunityId?: string;
  failed?: boolean;
};

// Runs the post-send step without a mail provider, so the record and its links can be checked on a server with no Gmail account
@Command({
  name: 'unified-email:record-test-sent-email',
  description:
    'Record an Email as if the CRM had just sent it (nothing is sent). For checks only; delete the record afterwards.',
})
export class RecordTestSentEmailCommand extends ProvisionedWorkspaceCommandRunner<RecordTestSentEmailCommandOptions> {
  constructor(
    protected readonly workspaceIteratorService: WorkspaceIteratorService,
    private readonly sentEmailRecorderService: SentEmailRecorderService,
  ) {
    super(workspaceIteratorService);
  }

  @Option({ flags: '--to <address>', required: true })
  parseTo(value: string, previous: string[] = []): string[] {
    return [...previous, value];
  }

  @Option({ flags: '--subject <subject>', required: true })
  parseSubject(value: string): string {
    return value;
  }

  @Option({ flags: '--source <source>', required: false })
  parseSource(value: string): string {
    return value;
  }

  @Option({ flags: '--opportunity-id <id>', required: false })
  parseOpportunityId(value: string): string {
    return value;
  }

  @Option({ flags: '--failed', required: false })
  parseFailed(): boolean {
    return true;
  }

  override async runOnWorkspace({
    workspaceId,
    options,
  }: RunOnWorkspaceArgs<RecordTestSentEmailCommandOptions>): Promise<void> {
    if (options.dryRun) {
      return;
    }

    const composedEmail = {
      recipients: { to: options.to ?? [], cc: [], bcc: [] },
      toRecipientsDisplay: (options.to ?? []).join(', '),
      sanitizedSubject: options.subject ?? '',
      plainTextBody: 'Test email body',
      sanitizedHtmlBody: '<p>Test email <strong>body</strong></p>',
      attachments: [],
      connectedAccount: {
        id: 'test',
        provider: 'test',
        handle: 'test@roboost.app',
      },
      shouldPersistMessage: false,
    } as unknown as ComposedEmail;

    const emailId = await this.sentEmailRecorderService.recordSentEmail({
      workspaceId,
      composedEmail,
      source: options.source === 'WORKFLOW' ? 'WORKFLOW' : 'CRM',
      ...(options.failed === true
        ? { deliveryError: 'Simulated failure' }
        : {
            sendResult: {
              headerMessageId: `<test-${Date.now()}@roboost.app>`,
            },
          }),
      opportunityIds: options.opportunityId ? [options.opportunityId] : [],
    });

    this.logger.log(`RESULT ${JSON.stringify({ emailId })}`);
  }
}
