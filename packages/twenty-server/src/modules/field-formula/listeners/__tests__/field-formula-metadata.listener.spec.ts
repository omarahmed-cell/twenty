import { FieldMetadataType } from 'twenty-shared/types';

import { FIELD_FORMULA_CATCH_UP_DELAY_MS } from 'src/modules/field-formula/jobs/field-formula.job';
import { FieldFormulaMetadataListener } from 'src/modules/field-formula/listeners/field-formula-metadata.listener';
import { type ResolvedFieldFormulaConfig } from 'src/modules/field-formula/types/resolved-field-formula-config.type';

const CONFIG: ResolvedFieldFormulaConfig = {
  targetFieldId: 'target-field',
  targetFieldName: 'computed',
  outputType: FieldMetadataType.NUMBER,
  outputConfig: {},
  objectNameSingular: 'opportunity',
  expression: 'price * 2',
  dependencies: [
    { fieldId: 'price-field', name: 'price', type: FieldMetadataType.NUMBER },
  ],
};

const FORMULA_SETTINGS = { formula: { expression: 'price * 2' } };

const buildField = (overrides: Record<string, unknown>) => ({
  id: 'other-field',
  name: 'other',
  objectMetadataId: 'opportunity',
  type: FieldMetadataType.NUMBER,
  isActive: true,
  settings: null,
  options: null,
  ...overrides,
});

const setup = () => {
  const add = jest.fn();

  const listener = new FieldFormulaMetadataListener(
    { getConfigs: async () => [CONFIG] } as never,
    { add } as never,
  );

  const handleUpdate = (
    before: Record<string, unknown>,
    after: Record<string, unknown>,
  ) =>
    listener.handleFieldUpdated({
      workspaceId: 'workspace',
      events: [
        {
          type: 'updated',
          properties: { before: buildField(before), after: buildField(after) },
        },
      ],
    } as never);

  const handleCreate = (field: Record<string, unknown>) =>
    listener.handleFieldCreated({
      workspaceId: 'workspace',
      events: [{ type: 'created', properties: { after: buildField(field) } }],
    } as never);

  return {
    handleUpdate,
    handleCreate,
    calls: () => add.mock.calls.map(([, data, options]) => ({ data, options })),
  };
};

const BACKFILL = {
  type: 'BACKFILL',
  workspaceId: 'workspace',
  targetFieldId: 'target-field',
};

const BACKFILL_NOW_AND_LATER = [
  { data: BACKFILL, options: undefined },
  { data: BACKFILL, options: { delay: FIELD_FORMULA_CATCH_UP_DELAY_MS } },
];

describe('FieldFormulaMetadataListener', () => {
  it('backfills a new formula now and after the cache window', async () => {
    const { handleCreate, calls } = setup();

    await handleCreate({ id: 'target-field', settings: FORMULA_SETTINGS });

    expect(calls()).toEqual(BACKFILL_NOW_AND_LATER);
  });

  it('wakes a formula up when a field it was waiting for is created', async () => {
    const { handleCreate, calls } = setup();

    await handleCreate({ id: 'price-field' });

    expect(calls()).toEqual(BACKFILL_NOW_AND_LATER);
  });

  it('does nothing for an unrelated new field', async () => {
    const { handleCreate, calls } = setup();

    await handleCreate({ id: 'other-field' });

    expect(calls()).toEqual([]);
  });

  it('backfills when the expression changes', async () => {
    const { handleUpdate, calls } = setup();

    await handleUpdate(
      { id: 'target-field', settings: FORMULA_SETTINGS },
      {
        id: 'target-field',
        settings: { formula: { expression: 'price * 3' } },
      },
    );

    expect(calls()).toEqual(BACKFILL_NOW_AND_LATER);
  });

  it("backfills when the formula field's own options change", async () => {
    const { handleUpdate, calls } = setup();

    await handleUpdate(
      {
        id: 'target-field',
        settings: FORMULA_SETTINGS,
        options: [{ value: 'A' }],
      },
      {
        id: 'target-field',
        settings: FORMULA_SETTINGS,
        options: [{ value: 'B' }],
      },
    );

    expect(calls()).toEqual(BACKFILL_NOW_AND_LATER);
  });

  it('ignores a label edit', async () => {
    const { handleUpdate, calls } = setup();

    await handleUpdate(
      { id: 'target-field', settings: FORMULA_SETTINGS, label: 'Before' },
      { id: 'target-field', settings: FORMULA_SETTINGS, label: 'After' },
    );

    expect(calls()).toEqual([]);
  });

  it('asks for references to be rewritten when a field is renamed', async () => {
    const { handleUpdate, calls } = setup();

    await handleUpdate(
      { id: 'other-field', name: 'before' },
      { id: 'other-field', name: 'after' },
    );

    expect(calls().map(({ data }) => data)).toEqual([
      {
        type: 'RENAME',
        workspaceId: 'workspace',
        objectMetadataId: 'opportunity',
        previousName: 'before',
        nextName: 'after',
      },
    ]);
  });

  it('backfills when a dependency option changes, since values migrate in SQL', async () => {
    const { handleUpdate, calls } = setup();

    await handleUpdate(
      { id: 'price-field', options: [{ value: 'A' }] },
      { id: 'price-field', options: [{ value: 'B' }] },
    );

    expect(calls()).toEqual(BACKFILL_NOW_AND_LATER);
  });

  it('catches up when a dependency is reactivated', async () => {
    const { handleUpdate, calls } = setup();

    await handleUpdate(
      { id: 'price-field', isActive: false },
      { id: 'price-field', isActive: true },
    );

    expect(calls()).toEqual(BACKFILL_NOW_AND_LATER);
  });
});
