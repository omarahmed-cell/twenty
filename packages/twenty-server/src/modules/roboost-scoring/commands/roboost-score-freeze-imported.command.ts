import { Command } from 'nest-commander';

import { ProvisionedWorkspaceCommandRunner } from 'src/database/commands/command-runners/provisioned-workspace.command-runner';
import { WorkspaceIteratorService } from 'src/database/commands/command-runners/workspace-iterator.service';
import { type RunOnWorkspaceArgs } from 'src/database/commands/command-runners/workspace.command-runner';
import { RoboostScoreRecalcService } from 'src/modules/roboost-scoring/services/roboost-score-recalc.service';
import { RoboostScoreStoreService } from 'src/modules/roboost-scoring/services/roboost-score-store.service';

@Command({
  name: 'roboost-score:freeze-imported',
  description:
    'For every deal score, freeze the HubSpot score of Closed Won deals loaded from HubSpot ("Imported from HubSpot"). Run it after the loader when a score is already linked to the imported property.',
})
export class RoboostScoreFreezeImportedCommand extends ProvisionedWorkspaceCommandRunner {
  constructor(
    protected readonly workspaceIteratorService: WorkspaceIteratorService,
    private readonly roboostScoreStoreService: RoboostScoreStoreService,
    private readonly roboostScoreRecalcService: RoboostScoreRecalcService,
  ) {
    super(workspaceIteratorService);
  }

  override async runOnWorkspace({
    workspaceId,
    options,
  }: RunOnWorkspaceArgs): Promise<void> {
    if (!(await this.roboostScoreStoreService.tablesExist(workspaceId))) {
      return;
    }
    const dealScores = (
      await this.roboostScoreStoreService.listScores(workspaceId)
    ).filter((score) => score.objectName === 'opportunity');

    for (const score of dealScores) {
      if (options.dryRun) {
        this.logger.log(
          `[DRY RUN] would freeze imported Closed Won deals for "${score.name}"`,
        );
        continue;
      }
      const count =
        await this.roboostScoreRecalcService.freezeImportedClosedWon(
          workspaceId,
          score.id,
        );

      this.logger.log(
        `Workspace ${workspaceId}: "${score.name}" froze ${count} imported Closed Won deal(s)`,
      );
    }
  }
}
