import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserVarsModule } from 'src/engine/core-modules/user/user-vars/user-vars.module';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { WorkspaceManyOrAllFlatEntityMapsCacheModule } from 'src/engine/metadata-modules/flat-entity/services/workspace-many-or-all-flat-entity-maps-cache.module';
import { PropertyHistoryTrimCronCommand } from 'src/modules/timeline/crons/commands/property-history-trim.cron.command';
import { PropertyHistoryTrimCronJob } from 'src/modules/timeline/crons/jobs/property-history-trim.cron.job';
import { PropertyHistoryLimitsService } from 'src/modules/timeline/services/property-history-limits.service';
import { PropertyHistoryTrimService } from 'src/modules/timeline/services/property-history-trim.service';
import { TimelineActivityRoutingPlanService } from 'src/modules/timeline/services/timeline-activity-routing-plan.service';
import { TimelineActivityTargetQueryService } from 'src/modules/timeline/services/timeline-activity-target-query.service';
import { TimelineActivityTypeCacheService } from 'src/modules/timeline/services/timeline-activity-type-cache.service';
import { TimelineActivityService } from 'src/modules/timeline/services/timeline-activity.service';
import { TimelineActivityRepository } from 'src/modules/timeline/repositories/timeline-activity.repository';

@Module({
  imports: [
    WorkspaceManyOrAllFlatEntityMapsCacheModule,
    UserVarsModule,
    TypeOrmModule.forFeature([WorkspaceEntity]),
  ],
  providers: [
    TimelineActivityRepository,
    TimelineActivityService,
    TimelineActivityRoutingPlanService,
    TimelineActivityTargetQueryService,
    TimelineActivityTypeCacheService,
    PropertyHistoryLimitsService,
    PropertyHistoryTrimService,
    PropertyHistoryTrimCronJob,
    PropertyHistoryTrimCronCommand,
  ],
  exports: [
    TimelineActivityRepository,
    TimelineActivityService,
    TimelineActivityTypeCacheService,
    TimelineActivityRoutingPlanService,
    PropertyHistoryTrimCronCommand,
  ],
})
export class TimelineActivityModule {}
