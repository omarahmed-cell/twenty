import { Injectable } from '@nestjs/common';

import { isDefined, isNonEmptyArray } from 'twenty-shared/utils';

import { OnDatabaseBatchEvent } from 'src/engine/api/graphql/graphql-query-runner/decorators/on-database-batch-event.decorator';
import { DatabaseEventAction } from 'src/engine/api/graphql/graphql-query-runner/enums/database-event-action';
import { InjectMessageQueue } from 'src/engine/core-modules/message-queue/decorators/message-queue.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';
import { type WorkspaceEventBatch } from 'src/engine/workspace-event-emitter/types/workspace-event-batch.type';
import {
  FieldFormulaJob,
  type FieldFormulaJobData,
} from 'src/modules/field-formula/jobs/field-formula.job';
import { FieldFormulaService } from 'src/modules/field-formula/services/field-formula.service';
import { type ResolvedFieldFormulaConfig } from 'src/modules/field-formula/types/resolved-field-formula-config.type';

type RecordEvent = {
  recordId: string;
  properties: { updatedFields?: string[] };
};

type RecordEventBatch = WorkspaceEventBatch<RecordEvent>;

// UPSERTED is deliberately not handled: the ORM emits it on every create and update, even
// without a diff, so a formula's own write would re-enqueue itself.
@Injectable()
export class FieldFormulaRecordListener {
  constructor(
    private readonly fieldFormulaService: FieldFormulaService,
    @InjectMessageQueue(MessageQueue.workspaceQueue)
    private readonly messageQueueService: MessageQueueService,
  ) {}

  @OnDatabaseBatchEvent('*', DatabaseEventAction.CREATED)
  async handleCreated(payload: RecordEventBatch) {
    await this.enqueue(payload, () => payload.events);
  }

  @OnDatabaseBatchEvent('*', DatabaseEventAction.RESTORED)
  async handleRestored(payload: RecordEventBatch) {
    await this.enqueue(payload, () => payload.events);
  }

  @OnDatabaseBatchEvent('*', DatabaseEventAction.UPDATED)
  async handleUpdated(payload: RecordEventBatch) {
    await this.enqueue(payload, (configs) => {
      // A job recomputes every formula on the object in order, so a change to a formula
      // field never needs a job of its own: that one would find nothing left to do.
      const formulaFieldIds = new Set(
        configs.map(({ targetFieldId }) => targetFieldId),
      );

      const dependencyNames = new Set(
        configs.flatMap(({ dependencies }) =>
          dependencies
            .filter(({ fieldId }) => !formulaFieldIds.has(fieldId))
            .map(({ name }) => name),
        ),
      );

      return payload.events.filter(({ properties }) =>
        (properties.updatedFields ?? []).some((fieldName) =>
          dependencyNames.has(fieldName),
        ),
      );
    });
  }

  private async enqueue(
    payload: RecordEventBatch,
    selectEvents: (configs: ResolvedFieldFormulaConfig[]) => RecordEvent[],
  ) {
    const objectNameSingular = payload.objectMetadata.nameSingular;

    const configs = (
      await this.fieldFormulaService.getConfigs(payload.workspaceId)
    ).filter((config) => config.objectNameSingular === objectNameSingular);

    if (configs.length === 0) {
      return;
    }

    const recordIds = [
      ...new Set(
        selectEvents(configs)
          .map(({ recordId }) => recordId)
          .filter(isDefined),
      ),
    ];

    if (!isNonEmptyArray(recordIds)) {
      return;
    }

    await this.messageQueueService.add<FieldFormulaJobData>(
      FieldFormulaJob.name,
      {
        type: 'RECORDS',
        workspaceId: payload.workspaceId,
        objectNameSingular,
        recordIds,
      },
    );
  }
}
