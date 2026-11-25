import { Injectable } from '@nestjs/common';

import { type ObjectRecordBaseEvent } from 'twenty-shared/database-events';
import { isDefined } from 'twenty-shared/utils';

import { RoboostLoadModeService } from 'src/engine/core-modules/roboost-load-mode/roboost-load-mode.service';
import { OnDatabaseBatchEvent } from 'src/engine/api/graphql/graphql-query-runner/decorators/on-database-batch-event.decorator';
import { DatabaseEventAction } from 'src/engine/api/graphql/graphql-query-runner/enums/database-event-action';
import { InjectMessageQueue } from 'src/engine/core-modules/message-queue/decorators/message-queue.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';
import { type WorkspaceEventBatch } from 'src/engine/workspace-event-emitter/types/workspace-event-batch.type';
import { STAGE_DATE_TRACKING_CONFIGS } from 'src/modules/stage-date-tracking/constants/stage-date-tracking-configs.constant';
import {
  StageDateTrackingJob,
  type StageDateTrackingJobData,
} from 'src/modules/stage-date-tracking/jobs/stage-date-tracking.job';
import { type StageDateUpdates } from 'src/modules/stage-date-tracking/types/stage-date-tracking-config.type';
import { computeStageDateUpdates } from 'src/modules/stage-date-tracking/utils/compute-stage-date-updates.util';

type StageEventBatch = WorkspaceEventBatch<
  ObjectRecordBaseEvent<Record<string, unknown>>
>;

// Listens to the ORM, so stage changes from the UI, API, workflows and imports are all dated
@Injectable()
export class StageDateTrackingListener {
  constructor(
    @InjectMessageQueue(MessageQueue.workspaceQueue)
    private readonly messageQueueService: MessageQueueService,
    private readonly roboostLoadModeService: RoboostLoadModeService,
  ) {}

  @OnDatabaseBatchEvent('*', DatabaseEventAction.CREATED)
  async handleCreated(batch: StageEventBatch) {
    await this.handleBatch(batch, false);
  }

  @OnDatabaseBatchEvent('*', DatabaseEventAction.UPDATED)
  async handleUpdated(batch: StageEventBatch) {
    await this.handleBatch(batch, true);
  }

  @OnDatabaseBatchEvent('*', DatabaseEventAction.UPSERTED)
  async handleUpserted(batch: StageEventBatch) {
    await this.handleBatch(batch, true);
  }

  private async handleBatch(batch: StageEventBatch, isUpdate: boolean) {
    // A migration load writes the HubSpot dates and history itself
    if (await this.roboostLoadModeService.isOn(batch.workspaceId)) {
      return;
    }

    const objectNameSingular = batch.objectMetadata?.nameSingular;
    const configs = STAGE_DATE_TRACKING_CONFIGS.filter(
      (config) => config.objectNameSingular === objectNameSingular,
    );

    if (configs.length === 0) {
      return;
    }

    // The write time stands for the change time, since the job may run a little later
    const changedAt = new Date().toISOString();

    const updates = batch.events
      .map((event) => {
        const before = event.properties?.before;
        const after = event.properties?.after;
        const recordId = event.recordId ?? (after?.id as string | undefined);

        if (!isDefined(recordId)) {
          return null;
        }

        const values = Object.assign(
          {},
          ...configs.map((config) =>
            computeStageDateUpdates({
              config,
              previousStage: isUpdate
                ? (before?.[config.stageFieldName] as string | null)
                : null,
              nextStage: after?.[config.stageFieldName] as string | null,
              changedAt,
            }),
          ),
        ) as StageDateUpdates;

        return Object.keys(values).length > 0 ? { recordId, values } : null;
      })
      .filter(isDefined);

    if (updates.length === 0) {
      return;
    }

    await this.messageQueueService.add<StageDateTrackingJobData>(
      StageDateTrackingJob.name,
      { workspaceId: batch.workspaceId, objectNameSingular, updates },
    );
  }
}
