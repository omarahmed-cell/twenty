import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { WorkspaceIteratorModule } from 'src/database/commands/command-runners/workspace-iterator.module';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { RecomputeTaskCalculatedFieldsCommand } from 'src/modules/task-calculated-fields/commands/recompute-task-calculated-fields.command';
import { TaskOverdueCronCommand } from 'src/modules/task-calculated-fields/crons/commands/task-overdue.cron.command';
import { TaskOverdueCronJob } from 'src/modules/task-calculated-fields/crons/jobs/task-overdue.cron.job';
import { TaskCalculatedFieldsJob } from 'src/modules/task-calculated-fields/jobs/task-calculated-fields.job';
import { TaskCalculatedFieldsListener } from 'src/modules/task-calculated-fields/listeners/task-calculated-fields.listener';
import { TaskOverdueService } from 'src/modules/task-calculated-fields/services/task-overdue.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([WorkspaceEntity]),
    WorkspaceIteratorModule,
  ],
  providers: [
    TaskOverdueService,
    TaskCalculatedFieldsJob,
    TaskCalculatedFieldsListener,
    TaskOverdueCronJob,
    TaskOverdueCronCommand,
    RecomputeTaskCalculatedFieldsCommand,
  ],
  exports: [TaskOverdueCronCommand, RecomputeTaskCalculatedFieldsCommand],
})
export class TaskCalculatedFieldsModule {}
