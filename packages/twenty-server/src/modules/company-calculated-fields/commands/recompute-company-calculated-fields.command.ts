import { Command } from 'nest-commander';

import { ProvisionedWorkspaceCommandRunner } from 'src/database/commands/command-runners/provisioned-workspace.command-runner';
import { WorkspaceIteratorService } from 'src/database/commands/command-runners/workspace-iterator.service';
import { type RunOnWorkspaceArgs } from 'src/database/commands/command-runners/workspace.command-runner';
import { CompanyCalculatedFieldsService } from 'src/modules/company-calculated-fields/services/company-calculated-fields.service';

@Command({
  name: 'company:recompute-calculated-fields',
  description:
    'Fully recompute the calculated fields (parent/child flags and counts, contact and deal counts, open deals, Last Activity Date) of every company. Run it after a data migration.',
})
export class RecomputeCompanyCalculatedFieldsCommand extends ProvisionedWorkspaceCommandRunner {
  constructor(
    protected readonly workspaceIteratorService: WorkspaceIteratorService,
    private readonly companyCalculatedFieldsService: CompanyCalculatedFieldsService,
  ) {
    super(workspaceIteratorService);
  }

  override async runOnWorkspace({
    workspaceId,
    options,
  }: RunOnWorkspaceArgs): Promise<void> {
    if (options.dryRun) {
      this.logger.log(
        `[DRY RUN] Workspace ${workspaceId}: would recompute company calculated fields`,
      );

      return;
    }

    const { companyCount, updatedCount } =
      await this.companyCalculatedFieldsService.recomputeAllCompanies(
        workspaceId,
      );

    this.logger.log(
      `Workspace ${workspaceId}: recomputed ${companyCount} companies, ${updatedCount} changed`,
    );
  }
}
