import { Command } from 'nest-commander';

import { ProvisionedWorkspaceCommandRunner } from 'src/database/commands/command-runners/provisioned-workspace.command-runner';
import { WorkspaceIteratorService } from 'src/database/commands/command-runners/workspace-iterator.service';
import { type RunOnWorkspaceArgs } from 'src/database/commands/command-runners/workspace.command-runner';
import { PersonCalculatedFieldsService } from 'src/modules/person-calculated-fields/services/person-calculated-fields.service';

@Command({
  name: 'person:recompute-calculated-fields',
  description:
    'Fully recompute the calculated fields (Last Activity Date, Next Activity Date, First Deal Created Date, Time in current stage) of every person. Run it after a data migration.',
})
export class RecomputePersonCalculatedFieldsCommand extends ProvisionedWorkspaceCommandRunner {
  constructor(
    protected readonly workspaceIteratorService: WorkspaceIteratorService,
    private readonly personCalculatedFieldsService: PersonCalculatedFieldsService,
  ) {
    super(workspaceIteratorService);
  }

  override async runOnWorkspace({
    workspaceId,
    options,
  }: RunOnWorkspaceArgs): Promise<void> {
    if (options.dryRun) {
      this.logger.log(
        `[DRY RUN] Workspace ${workspaceId}: would recompute person calculated fields`,
      );

      return;
    }

    const { personCount, updatedCount } =
      await this.personCalculatedFieldsService.recomputeAllPeople(workspaceId);

    this.logger.log(
      `Workspace ${workspaceId}: recomputed ${personCount} people, ${updatedCount} changed`,
    );
  }
}
