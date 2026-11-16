import { Command } from 'nest-commander';

import { ProvisionedWorkspaceCommandRunner } from 'src/database/commands/command-runners/provisioned-workspace.command-runner';
import { WorkspaceIteratorService } from 'src/database/commands/command-runners/workspace-iterator.service';
import { type RunOnWorkspaceArgs } from 'src/database/commands/command-runners/workspace.command-runner';
import { OpportunityCalculatedFieldsService } from 'src/modules/opportunity-calculated-fields/services/opportunity-calculated-fields.service';

@Command({
  name: 'opportunity:recompute-calculated-fields',
  description:
    'Fully recompute the calculated fields (Last Activity Date, Next Activity Date, Number of Associated Contacts, Number of Associated Line Items, Date entered current stage, Time in current stage) of every deal, and fill empty stage calculated properties from the stage history. Run it after a data migration.',
})
export class RecomputeOpportunityCalculatedFieldsCommand extends ProvisionedWorkspaceCommandRunner {
  constructor(
    protected readonly workspaceIteratorService: WorkspaceIteratorService,
    private readonly opportunityCalculatedFieldsService: OpportunityCalculatedFieldsService,
  ) {
    super(workspaceIteratorService);
  }

  override async runOnWorkspace({
    workspaceId,
    options,
  }: RunOnWorkspaceArgs): Promise<void> {
    if (options.dryRun) {
      this.logger.log(
        `[DRY RUN] Workspace ${workspaceId}: would recompute deal calculated fields`,
      );

      return;
    }

    const { opportunityCount, updatedCount } =
      await this.opportunityCalculatedFieldsService.recomputeAllOpportunities(
        workspaceId,
      );

    this.logger.log(
      `Workspace ${workspaceId}: recomputed ${opportunityCount} deals, ${updatedCount} changed`,
    );
  }
}
