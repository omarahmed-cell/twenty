import { Injectable, Logger } from '@nestjs/common';

import { type ObjectRecordBaseEvent } from 'twenty-shared/database-events';
import {
  isDefined,
  ROBOOST_SCORE_OBJECT_NAMES,
  type RoboostScoreObjectName,
} from 'twenty-shared/utils';

import { OnDatabaseBatchEvent } from 'src/engine/api/graphql/graphql-query-runner/decorators/on-database-batch-event.decorator';
import { DatabaseEventAction } from 'src/engine/api/graphql/graphql-query-runner/enums/database-event-action';
import { InjectMessageQueue } from 'src/engine/core-modules/message-queue/decorators/message-queue.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';
import { type WorkspaceEventBatch } from 'src/engine/workspace-event-emitter/types/workspace-event-batch.type';
import {
  RoboostScoreRecordsJob,
  type RoboostScoreRecordsJobData,
} from 'src/modules/roboost-scoring/jobs/roboost-score-records.job';
import { RoboostScoreStoreService } from 'src/modules/roboost-scoring/services/roboost-score-store.service';
import { collectRoboostScoreFieldNames } from 'src/modules/roboost-scoring/utils/collect-roboost-score-field-names.util';

type RecordEventBatch = WorkspaceEventBatch<
  ObjectRecordBaseEvent<Record<string, unknown>>
>;

// A short delay folds quick successive edits of one record into a single recalculation
const DEBOUNCE_MILLISECONDS = 2000;

@Injectable()
export class RoboostScoreRecordListener {
  private readonly logger = new Logger(RoboostScoreRecordListener.name);

  constructor(
    private readonly roboostScoreStoreService: RoboostScoreStoreService,
    @InjectMessageQueue(MessageQueue.workspaceQueue)
    private readonly messageQueueService: MessageQueueService,
  ) {}

  @OnDatabaseBatchEvent('*', DatabaseEventAction.CREATED)
  async handleCreated(batch: RecordEventBatch) {
    await this.handleBatch(batch, true);
  }

  @OnDatabaseBatchEvent('*', DatabaseEventAction.UPDATED)
  async handleUpdated(batch: RecordEventBatch) {
    await this.handleBatch(batch, false);
  }

  @OnDatabaseBatchEvent('*', DatabaseEventAction.RESTORED)
  async handleRestored(batch: RecordEventBatch) {
    await this.handleBatch(batch, true);
  }

  private async handleBatch(batch: RecordEventBatch, isEveryRecord: boolean) {
    const objectName = batch.objectMetadata?.nameSingular;

    if (
      !isDefined(objectName) ||
      !ROBOOST_SCORE_OBJECT_NAMES.includes(objectName as RoboostScoreObjectName)
    ) {
      return;
    }

    try {
      if (
        !(await this.roboostScoreStoreService.tablesExist(batch.workspaceId))
      ) {
        return;
      }
      const liveScores = await this.roboostScoreStoreService.findLiveScores(
        batch.workspaceId,
        objectName,
      );

      if (liveScores.length === 0) {
        return;
      }
      const watchedFields = new Set(
        liveScores.flatMap(({ version }) => [
          ...collectRoboostScoreFieldNames(version.criteria),
        ]),
      );

      if (objectName === 'opportunity') {
        watchedFields.add('stage');
      }
      const recordIds = batch.events
        .filter(
          (event) =>
            isEveryRecord ||
            Object.keys(event.properties.diff ?? {}).some((key) =>
              watchedFields.has(key),
            ),
        )
        .map((event) => event.recordId);

      if (recordIds.length === 0) {
        return;
      }
      await this.messageQueueService.add<RoboostScoreRecordsJobData>(
        RoboostScoreRecordsJob.name,
        { workspaceId: batch.workspaceId, objectName, recordIds },
        recordIds.length === 1
          ? {
              delay: DEBOUNCE_MILLISECONDS,
              deduplication: {
                id: `roboost-score-${batch.workspaceId}-${recordIds[0]}`,
              },
            }
          : undefined,
      );
    } catch (error) {
      this.logger.error(
        `Could not queue score recalculation for ${objectName}: ${error}`,
      );
    }
  }
}
