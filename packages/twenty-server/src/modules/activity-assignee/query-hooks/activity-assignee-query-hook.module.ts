import { Module } from '@nestjs/common';

import { ActivityAssigneeCreateManyPreQueryHook } from 'src/modules/activity-assignee/query-hooks/activity-assignee-create-many.pre-query.hook';
import { ActivityAssigneeCreateOnePreQueryHook } from 'src/modules/activity-assignee/query-hooks/activity-assignee-create-one.pre-query.hook';
import { ActivityTargetCreateOnePostQueryHook } from 'src/modules/activity-assignee/query-hooks/activity-target-create-one.post-query.hook';
import { WorkflowActivityOwnerAssigneeService } from 'src/modules/activity-assignee/services/workflow-activity-owner-assignee.service';

@Module({
  providers: [
    ActivityAssigneeCreateOnePreQueryHook,
    ActivityAssigneeCreateManyPreQueryHook,
    ActivityTargetCreateOnePostQueryHook,
    WorkflowActivityOwnerAssigneeService,
  ],
})
export class ActivityAssigneeQueryHookModule {}
