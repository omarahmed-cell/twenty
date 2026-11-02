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

  it('stores empty when the result does not fit the output type', async () => {
    const update = await recompute(
      buildConfig(FieldMetadataType.NUMBER, '"text"'),
      [{ id: 'deal', price: 1, branches: 1, computed: 5 }],
    );

    expect(update.mock.calls[0][1]).toEqual({ computed: null });
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
