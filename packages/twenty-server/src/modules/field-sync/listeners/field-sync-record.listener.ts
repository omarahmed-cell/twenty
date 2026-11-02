import { Injectable } from '@nestjs/common';

import { type ObjectRecordUpdateEvent } from 'twenty-shared/database-events';
import { isDefined, isNonEmptyArray } from 'twenty-shared/utils';

import { OnDatabaseBatchEvent } from 'src/engine/api/graphql/graphql-query-runner/decorators/on-database-batch-event.decorator';
import { DatabaseEventAction } from 'src/engine/api/graphql/graphql-query-runner/enums/database-event-action';
import { InjectMessageQueue } from 'src/engine/core-modules/message-queue/decorators/message-queue.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';
import { type WorkspaceEventBatch } from 'src/engine/workspace-event-emitter/types/workspace-event-batch.type';
import {
  FieldSyncJob,
  type FieldSyncJobData,
  type FieldSyncJobTask,
} from 'src/modules/field-sync/jobs/field-sync.job';
import { FieldSyncService } from 'src/modules/field-sync/services/field-sync.service';
import { type ResolvedFieldSyncConfig } from 'src/modules/field-sync/types/resolved-field-sync-config.type';

type RecordEvent = {
  recordId: string;
  properties: Partial<ObjectRecordUpdateEvent['properties']>;
};

type RecordEventBatch = WorkspaceEventBatch<RecordEvent>;

type ConfigRole = { isTarget: boolean; isSource: boolean };

const getRecordIds = (events: RecordEvent[]) => [
  ...new Set(events.map(({ recordId }) => recordId).filter(isDefined)),
];

const getRecordIdsUpdating = (events: RecordEvent[], fieldName: string) =>
  getRecordIds(
    events.filter(({ properties }) =>
      (properties.updatedFields ?? []).includes(fieldName),
    ),
  );

const targetsTask = (targetRecordIds: string[]): FieldSyncJobTask[] =>
  isNonEmptyArray(targetRecordIds)
    ? [{ type: 'TARGETS', targetRecordIds }]
    : [];

const sourcesTask = (sourceRecordIds: string[]): FieldSyncJobTask[] =>
  isNonEmptyArray(sourceRecordIds)
    ? [{ type: 'SOURCES', sourceRecordIds }]
    : [];

@Injectable()
export class FieldSyncRecordListener {
  constructor(
    private readonly fieldSyncService: FieldSyncService,
    @InjectMessageQueue(MessageQueue.workspaceQueue)
    private readonly messageQueueService: MessageQueueService,
  ) {}

  @OnDatabaseBatchEvent('*', DatabaseEventAction.CREATED)
  async handleCreated(payload: RecordEventBatch) {
    await this.dispatch(payload, (_config, { isTarget }) =>
      isTarget ? targetsTask(getRecordIds(payload.events)) : [],
    );
  }

  // UPSERTED is not handled: the ORM emits it on every create and update, even without a diff,
  // so a sync's own write would re-enqueue itself. CREATED and UPDATED already cover those writes.
  @OnDatabaseBatchEvent('*', DatabaseEventAction.UPDATED)
  async handleUpdated(payload: RecordEventBatch) {
    await this.dispatch(payload, (config, { isTarget, isSource }) => [
      ...(isTarget
        ? targetsTask(
            getRecordIdsUpdating(payload.events, config.joinColumnName),
          )
        : []),
      ...(isSource
        ? sourcesTask(
            getRecordIdsUpdating(payload.events, config.sourceFieldName),
          )
        : []),
    ]);
  }

  // A soft-deleted source counts as no association.
  @OnDatabaseBatchEvent('*', DatabaseEventAction.DELETED)
  async handleDeleted(payload: RecordEventBatch) {
    await this.dispatch(payload, (_config, { isSource }) =>
      isSource ? sourcesTask(getRecordIds(payload.events)) : [],
    );
  }

  @OnDatabaseBatchEvent('*', DatabaseEventAction.RESTORED)
  async handleRestored(payload: RecordEventBatch) {
    await this.dispatch(payload, (_config, role) =>
      this.recomputeBothSides(payload, role),
    );
  }

  @OnDatabaseBatchEvent('*', DatabaseEventAction.DESTROYED)
  async handleDestroyed(payload: RecordEventBatch) {
    await this.dispatch(payload, (_config, { isSource }) =>
      isSource ? [{ type: 'ORPHANS' }] : [],
    );
  }

  private recomputeBothSides(
    payload: RecordEventBatch,
    { isTarget, isSource }: ConfigRole,
  ): FieldSyncJobTask[] {
    const recordIds = getRecordIds(payload.events);

    return [
      ...(isTarget ? targetsTask(recordIds) : []),
      ...(isSource ? sourcesTask(recordIds) : []),
    ];
  }

  private async dispatch(
    payload: RecordEventBatch,
    buildTasks: (
      config: ResolvedFieldSyncConfig,
      role: ConfigRole,
    ) => FieldSyncJobTask[],
  ) {
    const objectNameSingular = payload.objectMetadata.nameSingular;

    const configs = await this.fieldSyncService.getConfigs(payload.workspaceId);

    for (const config of configs) {
      const role = {
        isTarget: config.targetObjectNameSingular === objectNameSingular,
        isSource: config.sourceObjectNameSingular === objectNameSingular,
      };

      if (!role.isTarget && !role.isSource) {
        continue;
      }

      for (const task of buildTasks(config, role)) {
        await this.messageQueueService.add<FieldSyncJobData>(
          FieldSyncJob.name,
          {
            ...task,
            workspaceId: payload.workspaceId,
            targetFieldId: config.targetFieldId,
          },
        );
      }
    }
  }
}
