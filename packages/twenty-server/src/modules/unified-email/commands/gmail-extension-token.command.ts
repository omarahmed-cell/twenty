import { Command, Option } from 'nest-commander';
import { InjectDataSource } from '@nestjs/typeorm';

import { isDefined } from 'twenty-shared/utils';
import { DataSource } from 'typeorm';

import {
  ProvisionedWorkspaceCommandRunner,
  type ProvisionedWorkspaceCommandOptions,
} from 'src/database/commands/command-runners/provisioned-workspace.command-runner';
import { WorkspaceIteratorService } from 'src/database/commands/command-runners/workspace-iterator.service';
import { type RunOnWorkspaceArgs } from 'src/database/commands/command-runners/workspace.command-runner';
import { getWorkspaceSchemaName } from 'src/engine/workspace-datasource/utils/get-workspace-schema-name.util';
import { GmailExtensionTokenService } from 'src/modules/unified-email/gmail-extension/services/gmail-extension-token.service';

type GmailExtensionTokenCommandOptions = ProvisionedWorkspaceCommandOptions & {
  memberId?: string;
  revoke?: string;
};

@Command({
  name: 'unified-email:gmail-extension-token',
  description:
    'Create a Gmail extension token for a workspace member (--member-id), or revoke one (--member-id and --revoke <token id>). Members normally do this in Settings > Gmail extension.',
})
export class GmailExtensionTokenCommand extends ProvisionedWorkspaceCommandRunner<GmailExtensionTokenCommandOptions> {
  constructor(
    protected readonly workspaceIteratorService: WorkspaceIteratorService,
    private readonly gmailExtensionTokenService: GmailExtensionTokenService,
    @InjectDataSource()
    private readonly coreDataSource: DataSource,
  ) {
    super(workspaceIteratorService);
  }

  @Option({ flags: '--member-id <id>', required: true })
  parseMemberId(value: string): string {
    return value;
  }

  @Option({ flags: '--revoke <tokenId>', required: false })
  parseRevoke(value: string): string {
    return value;
  }

  override async runOnWorkspace({
    workspaceId,
    options,
  }: RunOnWorkspaceArgs<GmailExtensionTokenCommandOptions>): Promise<void> {
    const [member]: { userId: string }[] = await this.coreDataSource.query(
      `SELECT "userId" FROM "${getWorkspaceSchemaName(workspaceId)}"."workspaceMember" WHERE id = $1`,
      [options.memberId],
    );

    if (!isDefined(member) || options.dryRun) {
      this.logger.log(
        `RESULT ${JSON.stringify({ error: 'member not found' })}`,
      );

      return;
    }

    if (isDefined(options.revoke)) {
      const isRevoked = await this.gmailExtensionTokenService.revoke({
        userId: member.userId,
        workspaceId,
        id: options.revoke,
      });

      this.logger.log(`RESULT ${JSON.stringify({ isRevoked })}`);

      return;
    }

    const created = await this.gmailExtensionTokenService.create({
      userId: member.userId,
      workspaceId,
      workspaceMemberId: options.memberId as string,
    });

    // Printed for the caller to capture once; it is never stored in clear text
    this.logger.log(`RESULT ${JSON.stringify(created)}`);
  }
}
