import { Command } from 'nest-commander';

import { ProvisionedWorkspaceCommandRunner } from 'src/database/commands/command-runners/provisioned-workspace.command-runner';
import { WorkspaceIteratorService } from 'src/database/commands/command-runners/workspace-iterator.service';
import { type RunOnWorkspaceArgs } from 'src/database/commands/command-runners/workspace.command-runner';
import { TaskOverdueService } from 'src/modules/task-calculated-fields/services/task-overdue.service';

@Command({
  name: 'task:recompute-calculated-fields',
  description:
    'Recompute Is Overdue on every task. Run it after a data migration.',
})
export class RecomputeTaskCalculatedFieldsCommand extends ProvisionedWorkspaceCommandRunner {
  constructor(
    protected readonly workspaceIteratorService: WorkspaceIteratorService,
    private readonly taskOverdueService: TaskOverdueService,
  ) {
    super(workspaceIteratorService);
  }

  override async runOnWorkspace({
    workspaceId,
    options,
  }: RunOnWorkspaceArgs): Promise<void> {
    if (options.dryRun) {
      this.logger.log(
        `[DRY RUN] Workspace ${workspaceId}: would recompute task calculated fields`,
      );

      return;
    }

    const newlyOverdue =
      await this.taskOverdueService.recomputeOverdue(workspaceId);

    this.logger.log(
      `Workspace ${workspaceId}: ${newlyOverdue.length} task(s) became overdue`,
    );
  }
}
