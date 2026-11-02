import { FieldMetadataType } from '@/types/FieldMetadataType';
import { buildFormulaVariables } from '@/utils/formula/buildFormulaVariables';
import { coerceFormulaResult } from '@/utils/formula/coerceFormulaResult';
import { evaluateFormula } from '@/utils/formula/evaluateFormula';
import { isFormulaValueUnchanged } from '@/utils/formula/isFormulaValueUnchanged';
import { parseFormula } from '@/utils/formula/parseFormula';

const RECORD = {
  branches: 5,
  price: 100,
  lineOfBusiness: 'PHARMACY',
  packages: ['FULL'],
  start: Date.parse('2026-03-01T00:00:00Z'),
  end: Date.parse('2026-03-15T00:00:00Z'),
  empty: null,
};

const evaluate = (expression: string, variables: object = RECORD) => {
  const result = evaluateFormula(
    expression,
    variables as Record<string, unknown>,
  );

  return result.status === 'success' ? result.value : result;
};

describe('evaluateFormula', () => {
  it.each([
    ['branches >= 1 && branches <= 10 ? price * branches : 0', 500],
    ['between(branches, 1, 10) == true ? price * branches : 0', 500],
    ['if(between(branches, 1, 10), price * branches, 0)', 500],
    ['if(between(50, 1, 10), price * branches, 0)', 0],
    ['lineOfBusiness == "PHARMACY" ? "Rx" : "Other"', 'Rx'],
    ['lineOfBusiness == "pharmacy"', false],
    ['"FULL" in packages', true],
    ['daysBetween(end, start)', 14],
    ['hoursBetween(end, start)', 336],
    ['round(10 / 3, 2)', 3.33],
    ['a + b * 2', 8],
    ['(a + b) * 2', 10],
    ['a - b - 1', -2],
  ])('computes %s', (expression, expected) => {
    expect(evaluate(expression, { ...RECORD, a: 2, b: 3 })).toEqual(expected);
  });

  it.each(['empty * 5', '5 * empty', 'empty + 1', 'missing * 5', 'empty / 2'])(
    'keeps %s empty instead of treating empty as zero',
    (expression) => {
      expect(evaluate(expression)).toBeNull();
    },
  );

  it.each([
    ['empty ?: 7', 7],
    ['isEmpty(empty)', true],
    ['min(empty, 3, 2)', 2],
    ['abs(empty)', null],
    ['daysBetween(end, empty)', null],
    ['between(empty, 1, 10)', false],
  ])('handles an empty input in %s', (expression, expected) => {
    expect(evaluate(expression)).toEqual(expected);
  });
});

describe('parseFormula', () => {
  it('extracts fields from every branch and ignores nested properties', () => {
    expect(
      parseFormula('branches > 1 ? price.amount * branches : round(other)'),
    ).toEqual({
      status: 'valid',
      fieldNames: ['branches', 'price', 'other'],
      functionNames: ['round'],
    });
  });

  it.each([
    '',
    '   ',
    '(branches + 1',
    'branches + 1)',
    'branches +',
    'branches price',
    'branches # 2',
    'nofn(1)',
    'branches|upper',
    'lineOfBusiness.constructor',
    'lineOfBusiness["constructor"]',
    'lineOfBusiness["__proto__"]',
    'x'.repeat(5001),
  ])('rejects %s', (expression) => {
    expect(parseFormula(expression).status).toBe('invalid');
  });

  it('is not confused by a parenthesis inside a string', () => {
    expect(parseFormula('lineOfBusiness == "("').status).toBe('valid');
  });

  it.each(['constructor()', 'process.exit()', 'require("fs")', 'danger()'])(
    'cannot call %s',
    (expression) => {
      expect(evaluate(expression, { danger: () => 'called' })).toEqual({
        status: 'error',
        error: expect.any(String),
      });
    },
  );
});

describe('coerceFormulaResult', () => {
  it.each([
    [5, FieldMetadataType.NUMBER, 5],
    [Number.NaN, FieldMetadataType.NUMBER, null],
    [Number.POSITIVE_INFINITY, FieldMetadataType.NUMBER, null],
    [null, FieldMetadataType.NUMBER, null],
    [undefined, FieldMetadataType.TEXT, null],
    ['', FieldMetadataType.TEXT, null],
    ['Rx', FieldMetadataType.TEXT, 'Rx'],
    [5, FieldMetadataType.TEXT, '5'],
    [true, FieldMetadataType.TEXT, 'true'],
    [Number.NaN, FieldMetadataType.TEXT, null],
    [true, FieldMetadataType.BOOLEAN, true],
  ] as const)('coerces %s to %s', (value, outputType, expected) => {
    expect(coerceFormulaResult(value, outputType)).toEqual({
      status: 'success',
      value: expected,
    });
  });

  it.each([
    ['text', FieldMetadataType.NUMBER],
    [true, FieldMetadataType.NUMBER],
    [1, FieldMetadataType.BOOLEAN],
    [['a'], FieldMetadataType.TEXT],
    [String, FieldMetadataType.TEXT],
  ] as const)('rejects %s as %s', (value, outputType) => {
    expect(coerceFormulaResult(value, outputType).status).toBe('error');
  });
});

// A record that looks changed on every run is what caused the sync field's endless job loop.
describe('isFormulaValueUnchanged', () => {
  it.each([
    ['', null, FieldMetadataType.TEXT],
    [null, null, FieldMetadataType.TEXT],
    ['Rx', 'Rx', FieldMetadataType.TEXT],
    [null, null, FieldMetadataType.NUMBER],
    ['500', 500, FieldMetadataType.NUMBER],
    [500, 500, FieldMetadataType.NUMBER],
    [0.30000000000000004, 0.3, FieldMetadataType.NUMBER],
    [true, true, FieldMetadataType.BOOLEAN],
    [null, null, FieldMetadataType.BOOLEAN],
  ] as const)(
    '%s and %s are unchanged as %s',
    (stored, computed, outputType) => {
      expect(isFormulaValueUnchanged(stored, computed, outputType)).toBe(true);
    },
  );

  it.each([
    [null, 0, FieldMetadataType.NUMBER],
    [0, null, FieldMetadataType.NUMBER],
    [500, 501, FieldMetadataType.NUMBER],
    ['Rx', 'Other', FieldMetadataType.TEXT],
    [false, true, FieldMetadataType.BOOLEAN],
    [null, false, FieldMetadataType.BOOLEAN],
  ] as const)('%s and %s differ as %s', (stored, computed, outputType) => {
    expect(isFormulaValueUnchanged(stored, computed, outputType)).toBe(false);
  });
});

describe('buildFormulaVariables', () => {
  it('converts values by field type', () => {
    expect(
      buildFormulaVariables(
        {
          count: '5',
          day: '2026-03-01',
          moment: new Date('2026-03-01T00:00:00Z'),
          name: '',
          tags: null,
          value: { amountMicros: '2500000', currencyCode: 'SAR' },
          stage: 'NEW',
        },
        [
          { name: 'count', type: FieldMetadataType.NUMBER },
          { name: 'day', type: FieldMetadataType.DATE },
          { name: 'moment', type: FieldMetadataType.DATE_TIME },
          { name: 'name', type: FieldMetadataType.TEXT },
          { name: 'tags', type: FieldMetadataType.MULTI_SELECT },
          { name: 'value', type: FieldMetadataType.CURRENCY },
          { name: 'stage', type: FieldMetadataType.SELECT },
          { name: 'absent', type: FieldMetadataType.TEXT },
        ],
      ),
    ).toEqual({
      count: 5,
      day: Date.parse('2026-03-01T00:00:00Z'),
      moment: Date.parse('2026-03-01T00:00:00Z'),
      name: null,
      tags: [],
      value: { amountMicros: '2500000', currencyCode: 'SAR', amount: 2.5 },
      stage: 'NEW',
      absent: null,
    });
  });

  it('does not treat 0 or false as empty', () => {
    expect(
      buildFormulaVariables({ count: 0, active: false }, [
        { name: 'count', type: FieldMetadataType.NUMBER },
        { name: 'active', type: FieldMetadataType.BOOLEAN },
      ]),
    ).toEqual({ count: 0, active: false });
  });
});
