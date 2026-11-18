import { Command, Option } from 'nest-commander';
import { FieldActorSource } from 'twenty-shared/types';

import {
  ProvisionedWorkspaceCommandRunner,
  type ProvisionedWorkspaceCommandOptions,
} from 'src/database/commands/command-runners/provisioned-workspace.command-runner';
import { WorkspaceIteratorService } from 'src/database/commands/command-runners/workspace-iterator.service';
import { type RunOnWorkspaceArgs } from 'src/database/commands/command-runners/workspace.command-runner';
import { EmailContactFindOrCreateService } from 'src/modules/unified-email/services/email-contact-find-or-create.service';
import { parseEmailAddressList } from 'src/modules/unified-email/utils/format-email-address-list.util';

type FindOrCreateEmailContactsCommandOptions =
  ProvisionedWorkspaceCommandOptions & {
    address?: string[];
  };

@Command({
  name: 'unified-email:find-or-create',
  description:
    'Find or create the contacts (and their companies) for email addresses, as the Gmail extension does. Pass --address "Name <email>" once per address.',
})
export class FindOrCreateEmailContactsCommand extends ProvisionedWorkspaceCommandRunner<FindOrCreateEmailContactsCommandOptions> {
  constructor(
    protected readonly workspaceIteratorService: WorkspaceIteratorService,
    private readonly emailContactFindOrCreateService: EmailContactFindOrCreateService,
  ) {
    super(workspaceIteratorService);
  }

  @Option({
    flags: '--address <address>',
    description: 'An address, optionally as "Name <email>"; repeatable',
    required: true,
  })
  parseAddress(value: string, previous: string[] = []): string[] {
    return [...previous, value];
  }

  override async runOnWorkspace({
    workspaceId,
    options,
  }: RunOnWorkspaceArgs<FindOrCreateEmailContactsCommandOptions>): Promise<void> {
    const participants = (options.address ?? []).flatMap((address) =>
      parseEmailAddressList(address),
    );

    if (options.dryRun) {
      this.logger.log(
        `[DRY RUN] Workspace ${workspaceId}: would resolve ${participants.length} address(es)`,
      );

      return;
    }

    const result = await this.emailContactFindOrCreateService.findOrCreate({
      workspaceId,
      participants,
      createdBy: {
        source: FieldActorSource.EMAIL,
        name: 'Email',
        workspaceMemberId: null,
        context: {},
      },
    });

    this.logger.log(`RESULT ${JSON.stringify(result)}`);
  }
}
