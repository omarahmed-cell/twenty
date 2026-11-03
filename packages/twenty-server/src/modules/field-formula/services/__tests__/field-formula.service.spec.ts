import { FieldMetadataType } from 'twenty-shared/types';

import { FieldFormulaService } from 'src/modules/field-formula/services/field-formula.service';
import { type ResolvedFieldFormulaConfig } from 'src/modules/field-formula/types/resolved-field-formula-config.type';

type TestRecord = Record<string, unknown> & { id: string };

const buildConfig = (
  outputType: ResolvedFieldFormulaConfig['outputType'],
  expression: string,
): ResolvedFieldFormulaConfig => ({
  targetFieldId: 'target-field',
  targetFieldName: 'computed',
  outputType,
  outputConfig: { optionValues: ['HIGH', 'LOW'], currencyCode: 'SAR' },
  objectNameSingular: 'opportunity',
  expression,
  dependencies: [
    { fieldId: 'price', name: 'price', type: FieldMetadataType.NUMBER },
    { fieldId: 'branches', name: 'branches', type: FieldMetadataType.NUMBER },
  ],
});

const recompute = async (
  config: ResolvedFieldFormulaConfig,
  records: TestRecord[],
) => {
  const update = jest.fn();

  const service = new FieldFormulaService(
    {
      executeInWorkspaceContext: (callback: () => Promise<void>) => callback(),
      getRepository: () => ({ find: async () => records, update }),
    } as never,
    {} as never,
    {} as never,
  );

  jest.spyOn(service, 'getConfigs').mockResolvedValue([config]);

  await service.recomputeRecords({
    workspaceId: 'workspace',
    objectNameSingular: 'opportunity',
    recordIds: records.map(({ id }) => id),
  });

  return update;
};

const FORMULA = 'price * branches';

const rewrite = async (
  fields: { id: string; expression: string; objectMetadataId?: string }[],
  input: {
    fieldId?: string;
    previousName?: string;
    nextName?: string;
    optionValueRenames?: { from: string; to: string }[];
  },
) => {
  const updateOneField = jest.fn();

  const service = new FieldFormulaService(
    {} as never,
    {
      evictWorkspaceFromLocalCache: jest.fn(),
      getOrRecompute: async () => ({
        flatFieldMetadataMaps: {
          byUniversalIdentifier: Object.fromEntries(
            fields.map(({ id, expression, objectMetadataId }) => [
              id,
              {
                id,
                objectMetadataId: objectMetadataId ?? 'opportunity',
                type: FieldMetadataType.TEXT,
                settings: { formula: { expression } },
              },
            ]),
          ),
        },
      }),
    } as never,
    { updateOneField } as never,
  );

  const backfill = jest.spyOn(service, 'backfill').mockResolvedValue();

  const affectedFieldIds = await service.rewriteReferences({
    workspaceId: 'workspace',
    objectMetadataId: 'opportunity',
    fieldId: 'line-field',
    previousName: 'line',
    nextName: 'line',
    optionValueRenames: [{ from: 'RETAIL', to: 'SHOP' }],
    ...input,
  });

  return {
    affectedFieldIds,
    backfilledFieldIds: backfill.mock.calls.map(
      ([{ targetFieldId }]) => targetFieldId,
    ),
    savedExpressions: updateOneField.mock.calls.map(
      ([{ updateFieldInput }]) => [
        updateFieldInput.id,
        updateFieldInput.settings.formula.expression,
      ],
    ),
    updateOrder: updateOneField.mock.invocationCallOrder,
    backfillOrder: backfill.mock.invocationCallOrder,
  };
};

describe('FieldFormulaService.backfill', () => {
  it('computes the target and what depends on it, nothing else', async () => {
    const update = jest.fn();
    const buildNumberConfig = (
      name: string,
      expression: string,
      dependencyName: string,
    ): ResolvedFieldFormulaConfig => ({
      ...buildConfig(FieldMetadataType.NUMBER, expression),
      targetFieldId: name,
      targetFieldName: name,
      dependencies: [
        {
          fieldId: dependencyName,
          name: dependencyName,
          type: FieldMetadataType.NUMBER,
        },
      ],
    });

    const service = new FieldFormulaService(
      {
        executeInWorkspaceContext: (callback: () => Promise<void>) =>
          callback(),
        getRepository: () => ({
          find: jest
            .fn()
            .mockResolvedValueOnce([{ id: 'deal', price: 2 }])
            .mockResolvedValue([]),
          update,
        }),
      } as never,
      { evictWorkspaceFromLocalCache: jest.fn() } as never,
      {} as never,
    );

    jest
      .spyOn(service, 'getConfigs')
      .mockResolvedValue([
        buildNumberConfig('unrelated', 'price * 5', 'price'),
        buildNumberConfig('first', 'price * 2', 'price'),
        buildNumberConfig('second', 'first + 1', 'first'),
      ]);

    await service.backfill({ workspaceId: 'workspace', targetFieldId: 'first' });

    expect(update.mock.calls[0][1]).toEqual({ first: 4, second: 5 });
  });
});

describe('FieldFormulaService.rewriteReferences', () => {
  it('saves every formula before backfilling, the changed field last', async () => {
    const { savedExpressions, updateOrder, backfillOrder } = await rewrite(
      [
        { id: 'line-field', expression: 'price > 1 ? "RETAIL" : "OTHER"' },
        { id: 'reader', expression: 'line == "RETAIL" ? 1 : 2' },
      ],
      {},
    );

    expect(savedExpressions.map(([id]) => id)).toEqual([
      'reader',
      'line-field',
    ]);
    expect(Math.max(...updateOrder)).toBeLessThan(Math.min(...backfillOrder));
  });

  it('rewrites comparisons on the renamed field and backfills after saving', async () => {
    const { savedExpressions, backfilledFieldIds, updateOrder, backfillOrder } =
      await rewrite([{ id: 'kind', expression: 'line == "RETAIL" ? 1 : 2' }], {});

    expect(savedExpressions).toEqual([['kind', 'line == "SHOP" ? 1 : 2']]);
    expect(backfilledFieldIds).toEqual(['kind']);
    expect(updateOrder[0]).toBeLessThan(backfillOrder[0]);
  });

  it('backfills a reader whose text has nothing to rewrite, without saving it', async () => {
    const { savedExpressions, backfilledFieldIds } = await rewrite(
      [{ id: 'label', expression: 'concat("Line: ", line)' }],
      {},
    );

    expect(savedExpressions).toEqual([]);
    expect(backfilledFieldIds).toEqual(['label']);
  });

  it('rewrites the results of the field whose own option changed', async () => {
    const { savedExpressions } = await rewrite(
      [{ id: 'line-field', expression: 'price > 1 ? "RETAIL" : "OTHER"' }],
      {},
    );

    expect(savedExpressions).toEqual([
      ['line-field', 'price > 1 ? "SHOP" : "OTHER"'],
    ]);
  });

  it('applies a field rename and an option rename in one save', async () => {
    const { savedExpressions } = await rewrite(
      [{ id: 'kind', expression: 'line == "RETAIL" ? 1 : 2' }],
      { nextName: 'channel' },
    );

    expect(savedExpressions).toEqual([['kind', 'channel == "SHOP" ? 1 : 2']]);
  });

  it('leaves formulas that do not read the field alone', async () => {
    const { affectedFieldIds, savedExpressions } = await rewrite(
      [
        { id: 'other', expression: 'kind == "RETAIL" ? 1 : 2' },
        {
          id: 'elsewhere',
          expression: 'line == "RETAIL" ? 1 : 2',
          objectMetadataId: 'company',
        },
      ],
      {},
    );

    expect(affectedFieldIds).toEqual([]);
    expect(savedExpressions).toEqual([]);
  });
});

describe('FieldFormulaService', () => {
  it('writes the computed value', async () => {
    const update = await recompute(
      buildConfig(FieldMetadataType.NUMBER, FORMULA),
      [{ id: 'deal', price: 100, branches: 5, computed: null }],
    );

    expect(update.mock.calls[0][1]).toEqual({ computed: 500 });
  });

  it('groups records that receive the same value into one write', async () => {
    const update = await recompute(
      buildConfig(FieldMetadataType.NUMBER, FORMULA),
      [
        { id: 'one', price: 100, branches: 5, computed: null },
        { id: 'two', price: 50, branches: 10, computed: null },
        { id: 'three', price: 2, branches: 2, computed: null },
      ],
    );

    expect(update).toHaveBeenCalledTimes(2);
  });

  it('stores empty when an input is empty, not zero', async () => {
    const update = await recompute(
      buildConfig(FieldMetadataType.NUMBER, FORMULA),
      [{ id: 'deal', price: null, branches: 5, computed: 500 }],
    );

    expect(update.mock.calls[0][1]).toEqual({ computed: null });
  });

  it('stores an empty currency as a composite, not null', async () => {
    const update = await recompute(
      buildConfig(FieldMetadataType.CURRENCY, 'null'),
      [
        {
          id: 'deal',
          price: 1,
          branches: 1,
          computed: { amountMicros: 5, currencyCode: 'SAR' },
        },
      ],
    );

    expect(update.mock.calls[0][1]).toEqual({
      computed: { amountMicros: null, currencyCode: null },
    });
  });

  it('stores empty when a select value is not one of its options', async () => {
    const update = await recompute(
      buildConfig(FieldMetadataType.SELECT, '"NOPE"'),
      [{ id: 'deal', price: 1, branches: 1, computed: 'HIGH' }],
    );

    expect(update.mock.calls[0][1]).toEqual({ computed: null });
  });

  it('stores empty when the result does not fit the output type', async () => {
    const update = await recompute(
      buildConfig(FieldMetadataType.NUMBER, '"text"'),
      [{ id: 'deal', price: 1, branches: 1, computed: 5 }],
    );

    expect(update.mock.calls[0][1]).toEqual({ computed: null });
  });

  it('feeds a formula the fresh value of the one before it, in one write', async () => {
    const update = jest.fn();

    const service = new FieldFormulaService(
      {
        executeInWorkspaceContext: (callback: () => Promise<void>) =>
          callback(),
        getRepository: () => ({
          find: async () => [
            { id: 'deal', price: 100, branches: 5, computed: 1, derived: 2 },
          ],
          update,
        }),
      } as never,
      {} as never,
      {} as never,
    );

    jest.spyOn(service, 'getConfigs').mockResolvedValue([
      buildConfig(FieldMetadataType.NUMBER, FORMULA),
      {
        ...buildConfig(FieldMetadataType.NUMBER, 'computed + 1'),
        targetFieldId: 'derived-field',
        targetFieldName: 'derived',
        dependencies: [
          {
            fieldId: 'target-field',
            name: 'computed',
            type: FieldMetadataType.NUMBER,
          },
        ],
      },
    ]);

    await service.recomputeRecords({
      workspaceId: 'workspace',
      objectNameSingular: 'opportunity',
      recordIds: ['deal'],
    });

    expect(update).toHaveBeenCalledTimes(1);
    expect(update.mock.calls[0][1]).toEqual({ computed: 500, derived: 501 });
  });

  // Rewriting on every run is what caused the sync field's endless job loop.
  it.each([
    [FieldMetadataType.NUMBER, FORMULA, 500],
    [FieldMetadataType.NUMBER, FORMULA, '500'],
    [FieldMetadataType.NUMBER, 'price / 3', 100 / 3],
    [FieldMetadataType.NUMBER, 'price * missingInRecord', null],
    [FieldMetadataType.TEXT, '"Rx"', 'Rx'],
    [FieldMetadataType.TEXT, 'null', ''],
    [FieldMetadataType.TEXT, 'null', null],
    [FieldMetadataType.BOOLEAN, 'price > 1', true],
    [FieldMetadataType.BOOLEAN, 'price < 1', false],
    [FieldMetadataType.BOOLEAN, 'null', null],
    [FieldMetadataType.DATE, 'date("2026-03-15")', '2026-03-15'],
    [FieldMetadataType.DATE, 'null', null],
    [
      FieldMetadataType.DATE_TIME,
      'date("2026-03-15T12:30:00Z")',
      new Date('2026-03-15T12:30:00Z'),
    ],
    [FieldMetadataType.SELECT, '"HIGH"', 'HIGH'],
    [FieldMetadataType.SELECT, 'null', null],
    [
      FieldMetadataType.CURRENCY,
      'price * 2',
      { amountMicros: '200000000', currencyCode: 'SAR' },
    ],
    [
      FieldMetadataType.CURRENCY,
      'null',
      { amountMicros: null, currencyCode: '' },
    ],
  ] as const)(
    'does not rewrite an up-to-date %s: %s',
    async (outputType, expression, storedValue) => {
      const update = await recompute(buildConfig(outputType, expression), [
        { id: 'deal', price: 100, branches: 5, computed: storedValue },
      ]);

      expect(update).not.toHaveBeenCalled();
    },
  );
});
