import { FieldMetadataType } from 'twenty-shared/types';

import { FieldFormulaRecordListener } from 'src/modules/field-formula/listeners/field-formula-record.listener';
import { type ResolvedFieldFormulaConfig } from 'src/modules/field-formula/types/resolved-field-formula-config.type';

const CONFIG: ResolvedFieldFormulaConfig = {
  targetFieldId: 'target-field',
  targetFieldName: 'computed',
  outputType: FieldMetadataType.NUMBER,
  objectNameSingular: 'opportunity',
  expression: 'price * branches',
  dependencies: [
    { fieldId: 'price', name: 'price', type: FieldMetadataType.NUMBER },
    { fieldId: 'branches', name: 'branches', type: FieldMetadataType.NUMBER },
  ],
};

const setup = () => {
  const add = jest.fn();

  const listener = new FieldFormulaRecordListener(
    { getConfigs: async () => [CONFIG] } as never,
    { add } as never,
  );

  return { listener, jobs: () => add.mock.calls.map(([, data]) => data) };
};

const buildPayload = (
  objectNameSingular: string,
  events: { recordId: string; updatedFields?: string[] }[],
) =>
  ({
    workspaceId: 'workspace',
    objectMetadata: { nameSingular: objectNameSingular },
    events: events.map(({ recordId, updatedFields }) => ({
      recordId,
      properties: { updatedFields },
    })),
  }) as never;

const recordsJob = (recordIds: string[]) => ({
  type: 'RECORDS',
  workspaceId: 'workspace',
  objectNameSingular: 'opportunity',
  recordIds,
});

describe('FieldFormulaRecordListener', () => {
  it.each(['handleCreated', 'handleRestored'] as const)(
    'recomputes records on %s',
    async (handler) => {
      const { listener, jobs } = setup();

      await listener[handler](
        buildPayload('opportunity', [{ recordId: 'deal' }]),
      );

      expect(jobs()).toEqual([recordsJob(['deal'])]);
    },
  );

  it('recomputes only the records whose dependency changed', async () => {
    const { listener, jobs } = setup();

    await listener.handleUpdated(
      buildPayload('opportunity', [
        { recordId: 'changed', updatedFields: ['price'] },
        { recordId: 'unrelated', updatedFields: ['name'] },
      ]),
    );

    expect(jobs()).toEqual([recordsJob(['changed'])]);
  });

  it("does not react to the formula's own write", async () => {
    const { listener, jobs } = setup();

    await listener.handleUpdated(
      buildPayload('opportunity', [
        { recordId: 'deal', updatedFields: ['computed'] },
      ]),
    );

    expect(jobs()).toEqual([]);
  });

  it('ignores other objects', async () => {
    const { listener, jobs } = setup();

    await listener.handleCreated(
      buildPayload('company', [{ recordId: 'company' }]),
    );

    expect(jobs()).toEqual([]);
  });

  // The ORM emits UPSERTED on every write, even without a diff, which once caused an endless job loop.
  it('has no handler for UPSERTED events', () => {
    expect(
      Object.getOwnPropertyNames(FieldFormulaRecordListener.prototype),
    ).not.toContain('handleUpserted');
  });
});
