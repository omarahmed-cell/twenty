import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { isDefined } from 'twenty-shared/utils';

import { InjectMessageQueue } from 'src/engine/core-modules/message-queue/decorators/message-queue.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';
import { type FlatFieldMetadata } from 'src/engine/metadata-modules/flat-field-metadata/types/flat-field-metadata.type';
import { type MetadataEventBatch } from 'src/engine/subscriptions/metadata-event/types/metadata-event-batch.type';
import {
  FIELD_FORMULA_CATCH_UP_DELAY_MS,
  FieldFormulaJob,
  type FieldFormulaJobData,
} from 'src/modules/field-formula/jobs/field-formula.job';
import { FieldFormulaService } from 'src/modules/field-formula/services/field-formula.service';
import { getFieldFormulaSettings } from 'src/modules/field-formula/utils/resolve-field-formula-configs.util';

type FieldMetadataEventBatch = MetadataEventBatch<
  'fieldMetadata',
  'created' | 'updated'
>;

const isSameJson = (left: unknown, right: unknown) =>
  JSON.stringify(left ?? null) === JSON.stringify(right ?? null);

type FieldOption = { id?: string; value: string };

const getOptionValueRenames = (
  before: FlatFieldMetadata,
  after: FlatFieldMetadata,
) => {
  const beforeOptions = (before.options ?? []) as FieldOption[];

  return ((after.options ?? []) as FieldOption[]).flatMap(({ id, value }) => {
    const previous = beforeOptions.find(
      (option) => isDefined(id) && option.id === id,
    );

    return isDefined(previous) && previous.value !== value
      ? [{ from: previous.value, to: value }]
      : [];
  });
};

@Injectable()
export class FieldFormulaMetadataListener {
  constructor(
    private readonly fieldFormulaService: FieldFormulaService,
    @InjectMessageQueue(MessageQueue.workspaceQueue)
    private readonly messageQueueService: MessageQueueService,
  ) {}

  @OnEvent('metadata.fieldMetadata.created')
  async handleFieldCreated(payload: FieldMetadataEventBatch) {
    for (const event of payload.events) {
      if (!('after' in event.properties)) {
        continue;
      }

      const field = event.properties.after as FlatFieldMetadata;

      if (isDefined(getFieldFormulaSettings(field))) {
        await this.enqueueBackfill(payload.workspaceId, field.id);
      }

      // A formula can be saved before a field it references exists, which pauses it until now.
      const configs = await this.fieldFormulaService.getConfigs(
        payload.workspaceId,
      );

      for (const config of configs) {
        if (config.dependencies.some(({ fieldId }) => fieldId === field.id)) {
          await this.enqueueBackfill(payload.workspaceId, config.targetFieldId);
        }
      }
    }
  }

  // Label and icon edits are ignored; only changes that can alter computed values re-run.
  @OnEvent('metadata.fieldMetadata.updated')
  async handleFieldUpdated(payload: FieldMetadataEventBatch) {
    const configs = await this.fieldFormulaService.getConfigs(
      payload.workspaceId,
    );

    const targetFieldIds = new Set<string>();

    for (const event of payload.events) {
      if (event.type !== 'updated') {
        continue;
      }

      const before = event.properties.before as FlatFieldMetadata;
      const after = event.properties.after as FlatFieldMetadata;

      const optionValueRenames = getOptionValueRenames(before, after);

      if (before.name !== after.name || optionValueRenames.length > 0) {
        await this.messageQueueService.add<FieldFormulaJobData>(
          FieldFormulaJob.name,
          {
            type: 'REWRITE_REFERENCES',
            workspaceId: payload.workspaceId,
            objectMetadataId: after.objectMetadataId,
            fieldId: after.id,
            previousName: before.name,
            nextName: after.name,
            optionValueRenames,
          },
        );
      }

      // That job backfills once the text is right: doing it now would write results from the old values.
      if (optionValueRenames.length > 0) {
        continue;
      }

      const needsCatchUp =
        (!before.isActive && after.isActive) || before.name !== after.name;

      if (
        isDefined(getFieldFormulaSettings(after)) &&
        (needsCatchUp ||
          !isSameJson(before.options, after.options) ||
          !isSameJson(
            getFieldFormulaSettings(before),
            getFieldFormulaSettings(after),
          ))
      ) {
        targetFieldIds.add(after.id);
      }

      // Renaming a select option migrates stored values in SQL, without any record event.
      const dependencyValuesMayHaveChanged =
        needsCatchUp || !isSameJson(before.options, after.options);

      if (!dependencyValuesMayHaveChanged) {
        continue;
      }

      for (const config of configs) {
        if (config.dependencies.some(({ fieldId }) => fieldId === after.id)) {
          targetFieldIds.add(config.targetFieldId);
        }
      }
    }

    for (const targetFieldId of targetFieldIds) {
      await this.enqueueBackfill(payload.workspaceId, targetFieldId);
    }
  }

  private async enqueueBackfill(workspaceId: string, targetFieldId: string) {
    await this.messageQueueService.add<FieldFormulaJobData>(
      FieldFormulaJob.name,
      { type: 'BACKFILL', workspaceId, targetFieldId },
    );

    await this.messageQueueService.add<FieldFormulaJobData>(
      FieldFormulaJob.name,
      { type: 'BACKFILL', workspaceId, targetFieldId },
      { delay: FIELD_FORMULA_CATCH_UP_DELAY_MS },
    );
  }
}
