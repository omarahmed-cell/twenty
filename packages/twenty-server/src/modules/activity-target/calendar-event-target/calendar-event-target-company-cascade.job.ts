import { Scope } from '@nestjs/common';

import { Process } from 'src/engine/core-modules/message-queue/decorators/process.decorator';
import { Processor } from 'src/engine/core-modules/message-queue/decorators/processor.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { buildSystemAuthContext } from 'src/engine/twenty-orm/utils/build-system-auth-context.util';
import { CalendarEventCompanyTimelineService } from 'src/modules/activity-target/calendar-event-target/calendar-event-company-timeline.service';
import { ActivityTargetCompanyCascadeService } from 'src/modules/activity-target/query-hooks/activity-target-company-cascade.service';

export type CalendarEventTargetCompanyCascadeJobData = {
  workspaceId: string;
  calendarEventTargetIds: string[];
};

@Processor({ queueName: MessageQueue.calendarQueue, scope: Scope.REQUEST })
export class CalendarEventTargetCompanyCascadeJob {
  constructor(
    private readonly activityTargetCompanyCascadeService: ActivityTargetCompanyCascadeService,
    private readonly calendarEventCompanyTimelineService: CalendarEventCompanyTimelineService,
  ) {}

  @Process(CalendarEventTargetCompanyCascadeJob.name)
  async handle({
    workspaceId,
    calendarEventTargetIds,
  }: CalendarEventTargetCompanyCascadeJobData): Promise<void> {
    // Company links added here emit their own created events, which bring them back through this job for the timeline
    await this.activityTargetCompanyCascadeService.addParentCompanyTargets(
      buildSystemAuthContext(workspaceId),
      {
        junctionObjectName: 'calendarEventTarget',
        activityIdFieldName: 'calendarEventId',
        // Participant sync deletes links that are neither manual nor still matched
        createdTargetDefaults: {
          isManuallyAssigned: true,
          isAutomaticallyAssigned: false,
        },
      },
      calendarEventTargetIds.map((id) => ({ id })),
    );

    await this.calendarEventCompanyTimelineService.addLinkedRecordTimelineActivities(
      { workspaceId, calendarEventTargetIds },
    );
  }
}
