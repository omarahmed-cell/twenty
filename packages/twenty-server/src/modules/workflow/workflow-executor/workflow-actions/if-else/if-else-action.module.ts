import { Module } from '@nestjs/common';

import { RoboostRecordVisibilityModule } from 'src/engine/metadata-modules/role/roboost-record-visibility.module';
import { IfElseWorkflowAction } from 'src/modules/workflow/workflow-executor/workflow-actions/if-else/if-else.workflow-action';

@Module({
  imports: [RoboostRecordVisibilityModule],
  providers: [IfElseWorkflowAction],
  exports: [IfElseWorkflowAction],
})
export class IfElseActionModule {}
