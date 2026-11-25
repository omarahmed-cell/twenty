import { Command, Option } from 'nest-commander';

import { ProvisionedWorkspaceCommandRunner } from 'src/database/commands/command-runners/provisioned-workspace.command-runner';
import { WorkspaceIteratorService } from 'src/database/commands/command-runners/workspace-iterator.service';
import {
  type RunOnWorkspaceArgs,
  type WorkspaceCommandOptions,
} from 'src/database/commands/command-runners/workspace.command-runner';
import { RoboostLoadModeService } from 'src/engine/core-modules/roboost-load-mode/roboost-load-mode.service';
import { RoboostDuplicateService } from 'src/modules/roboost-merge/services/roboost-duplicate.service';
import { RoboostScoreRecalcService } from 'src/modules/roboost-scoring/services/roboost-score-recalc.service';
import { RoboostScoreStoreService } from 'src/modules/roboost-scoring/services/roboost-score-store.service';

type RoboostLoadModeCommandOptions = WorkspaceCommandOptions & {
  on?: boolean;
  off?: boolean;
  status?: boolean;
};

@Command({
  name: 'roboost:load-mode',
  description:
    'Bulk load mode for a migration. --on pauses bell/email notifications, workflow triggers, per-record score recalculation and the nightly duplicate scan. --off turns them back on, then recalculates every score and runs one duplicate scan. --status prints the current state.',
})
export class RoboostLoadModeCommand extends ProvisionedWorkspaceCommandRunner<RoboostLoadModeCommandOptions> {
  constructor(
    protected readonly workspaceIteratorService: WorkspaceIteratorService,
    private readonly roboostLoadModeService: RoboostLoadModeService,
    private readonly roboostScoreStoreService: RoboostScoreStoreService,
    private readonly roboostScoreRecalcService: RoboostScoreRecalcService,
    private readonly roboostDuplicateService: RoboostDuplicateService,
  ) {
    super(workspaceIteratorService);
  }

  @Option({ flags: '--on', description: 'Turn load mode on' })
  parseOn(): boolean {
    return true;
  }

  @Option({ flags: '--off', description: 'Turn load mode off and catch up' })
  parseOff(): boolean {
    return true;
  }

  @Option({ flags: '--status', description: 'Print whether load mode is on' })
  parseStatus(): boolean {
    return true;
  }

  override async runOnWorkspace({
    workspaceId,
    options,
  }: RunOnWorkspaceArgs<RoboostLoadModeCommandOptions>): Promise<void> {
    if (options.on === true) {
      await this.roboostLoadModeService.set(workspaceId, true);
      this.logger.log(
        `Workspace ${workspaceId}: load mode ON. Wait 15 seconds before loading so every server and worker sees it.`,
      );

      return;
    }

    if (options.off !== true) {
      this.logger.log(
        `Workspace ${workspaceId}: load mode is ${(await this.roboostLoadModeService.isOn(workspaceId)) ? 'ON' : 'OFF'}`,
      );

      return;
    }

    await this.roboostLoadModeService.set(workspaceId, false);
    this.logger.log(`Workspace ${workspaceId}: load mode OFF, catching up`);

    if (await this.roboostScoreStoreService.tablesExist(workspaceId)) {
      for (const {
        score,
      } of await this.roboostScoreStoreService.findLiveScores(workspaceId)) {
        const totals = await this.roboostScoreRecalcService.recalculateScore({
          workspaceId,
          scoreId: score.id,
          mode: 'full',
        });

        this.logger.log(
          `Workspace ${workspaceId}: score ${score.id} recalculated ${JSON.stringify(totals)}`,
        );
      }
    }

    if (await this.roboostDuplicateService.tablesExist(workspaceId)) {
      const counts = await this.roboostDuplicateService.scanAll(workspaceId);

      this.logger.log(
        `Workspace ${workspaceId}: duplicate scan ${JSON.stringify(counts)}`,
      );
    }
  }
}
