import { Module } from '@nestjs/common';

import { RoboostRecordVisibilityModule } from 'src/engine/metadata-modules/role/roboost-record-visibility.module';
import { FilterWorkflowAction } from 'src/modules/workflow/workflow-executor/workflow-actions/filter/filter.workflow-action';

@Module({
  imports: [RoboostRecordVisibilityModule],
  providers: [FilterWorkflowAction],
  exports: [FilterWorkflowAction],
})
export class FilterActionModule {}
