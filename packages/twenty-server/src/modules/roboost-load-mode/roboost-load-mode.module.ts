import { Module } from '@nestjs/common';

import { WorkspaceIteratorModule } from 'src/database/commands/command-runners/workspace-iterator.module';
import { RoboostLoadModeCommand } from 'src/modules/roboost-load-mode/roboost-load-mode.command';
import { RoboostMergeModule } from 'src/modules/roboost-merge/roboost-merge.module';
import { RoboostScoringModule } from 'src/modules/roboost-scoring/roboost-scoring.module';

@Module({
  imports: [WorkspaceIteratorModule, RoboostScoringModule, RoboostMergeModule],
  providers: [RoboostLoadModeCommand],
})
export class RoboostLoadModeCommandModule {}
