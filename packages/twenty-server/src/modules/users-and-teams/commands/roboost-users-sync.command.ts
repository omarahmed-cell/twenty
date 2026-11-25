import { Command } from 'nest-commander';

import { ProvisionedWorkspaceCommandRunner } from 'src/database/commands/command-runners/provisioned-workspace.command-runner';
import { WorkspaceIteratorService } from 'src/database/commands/command-runners/workspace-iterator.service';
import { type RunOnWorkspaceArgs } from 'src/database/commands/command-runners/workspace.command-runner';
import { RoboostUsersService } from 'src/modules/users-and-teams/services/roboost-users.service';

@Command({
  name: 'users-and-teams:sync',
  description:
    'Give every member without saved permissions the default member permissions (current admins stay Admin), then put every signed-in member on their private role.',
})
export class RoboostUsersSyncCommand extends ProvisionedWorkspaceCommandRunner {
  constructor(
    protected readonly workspaceIteratorService: WorkspaceIteratorService,
    private readonly roboostUsersService: RoboostUsersService,
  ) {
    super(workspaceIteratorService);
  }

  override async runOnWorkspace({
    workspaceId,
    options,
  }: RunOnWorkspaceArgs): Promise<void> {
    if (options.dryRun) {
      this.logger.log(`[DRY RUN] would seed permissions for ${workspaceId}`);

      return;
    }

    const { seeded } =
      await this.roboostUsersService.seedMissingPermissions(workspaceId);

    for (const { name, role } of seeded) {
      this.logger.log(
        `Workspace ${workspaceId}: ${name} -> ${role === 'ADMIN' ? 'Admin' : 'Member with default permissions'}`,
      );
    }

    this.logger.log(
      `Workspace ${workspaceId}: ${seeded.length} member(s) seeded`,
    );
  }
}
