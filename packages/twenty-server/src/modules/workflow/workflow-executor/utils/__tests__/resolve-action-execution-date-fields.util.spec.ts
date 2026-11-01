import { FieldMetadataType } from 'twenty-shared/types';
import { WORKFLOW_ACTION_EXECUTION_DATE_TOKEN } from 'twenty-shared/workflow';

import { type FlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-maps.type';
import { getFlatFieldMetadataMock } from 'src/engine/metadata-modules/flat-field-metadata/__mocks__/get-flat-field-metadata.mock';
import { type FlatFieldMetadata } from 'src/engine/metadata-modules/flat-field-metadata/types/flat-field-metadata.type';
import { getFlatObjectMetadataMock } from 'src/engine/metadata-modules/flat-object-metadata/__mocks__/get-flat-object-metadata.mock';
import { resolveActionExecutionDateFields } from 'src/modules/workflow/workflow-executor/utils/resolve-action-execution-date-fields.util';

const enteredAtField = getFlatFieldMetadataMock({
  id: 'entered-at-field',
  universalIdentifier: 'entered-at-universal-id',
  objectMetadataId: 'opportunity-object',
  name: 'enteredAt',
  type: FieldMetadataType.DATE_TIME,
});

const closeDateField = getFlatFieldMetadataMock({
  id: 'close-date-field',
  universalIdentifier: 'close-date-universal-id',
  objectMetadataId: 'opportunity-object',
  name: 'closeDate',
  type: FieldMetadataType.DATE,
});

const nameField = getFlatFieldMetadataMock({
  id: 'name-field',
  universalIdentifier: 'name-universal-id',
  objectMetadataId: 'opportunity-object',
  name: 'name',
  type: FieldMetadataType.TEXT,
});

const fields = [enteredAtField, closeDateField, nameField];

const flatFieldMetadataMaps: FlatEntityMaps<FlatFieldMetadata> = {
  byUniversalIdentifier: Object.fromEntries(
    fields.map((field) => [field.universalIdentifier, field]),
  ),
  universalIdentifierById: Object.fromEntries(
    fields.map((field) => [field.id, field.universalIdentifier]),
  ),
  universalIdentifiersByApplicationId: {},
};

const objectMetadataInfo = {
  flatObjectMetadata: getFlatObjectMetadataMock({
    id: 'opportunity-object',
    universalIdentifier: 'opportunity-universal-id',
    nameSingular: 'opportunity',
    namePlural: 'opportunities',
    fieldIds: fields.map((field) => field.id),
  }),
  flatFieldMetadataMaps,
};

const executedAt = new Date('2026-11-01T18:45:12.345Z');

describe('resolveActionExecutionDateFields', () => {
  it('stamps a date time field with the full execution timestamp', () => {
    const resolved = resolveActionExecutionDateFields(
      { enteredAt: WORKFLOW_ACTION_EXECUTION_DATE_TOKEN },
      objectMetadataInfo,
      executedAt,
    );

    expect(resolved.enteredAt).toBe('2026-11-01T18:45:12.345Z');
  });

  it('stamps a date field with the execution day only', () => {
    const resolved = resolveActionExecutionDateFields(
      { closeDate: WORKFLOW_ACTION_EXECUTION_DATE_TOKEN },
      objectMetadataInfo,
      executedAt,
    );

    expect(resolved.closeDate).toBe('2026-11-01');
  });

  it('leaves manual dates, variables and non-date fields untouched', () => {
    const objectRecord = {
      enteredAt: '2026-01-15T09:00:00.000Z',
      closeDate: '{{trigger.object.closeDate}}',
      name: WORKFLOW_ACTION_EXECUTION_DATE_TOKEN,
    };

    expect(
      resolveActionExecutionDateFields(
        objectRecord,
        objectMetadataInfo,
        executedAt,
      ),
    ).toEqual(objectRecord);
  });
});
