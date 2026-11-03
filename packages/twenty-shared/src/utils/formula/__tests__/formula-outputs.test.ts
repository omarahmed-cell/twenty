import { FieldMetadataType } from '@/types/FieldMetadataType';
import { coerceFormulaResult } from '@/utils/formula/coerceFormulaResult';
import { evaluateFormula } from '@/utils/formula/evaluateFormula';
import { formatDuration } from '@/utils/formula/formatDuration';
import {
  FORMULA_FUNCTION_SIGNATURES,
  FORMULA_FUNCTIONS,
} from '@/utils/formula/formulaEngine';
import { isFormulaValueUnchanged } from '@/utils/formula/isFormulaValueUnchanged';
import { parseFormula } from '@/utils/formula/parseFormula';

const DAY = Date.parse('2026-03-15T12:30:00.000Z');

const evaluate = (expression: string, variables = {}) => {
  const result = evaluateFormula(expression, variables);

  return result.status === 'success' ? result.value : result;
};

describe('date functions', () => {
  it.each([
    ['addDays(day, 1)', Date.parse('2026-03-16T12:30:00.000Z')],
    ['addDays(day, 0 - 15)', Date.parse('2026-02-28T12:30:00.000Z')],
    ['addHours(day, 2)', Date.parse('2026-03-15T14:30:00.000Z')],
    ['addMonths(day, 1)', Date.parse('2026-04-15T12:30:00.000Z')],
    ['year(day)', 2026],
    ['month(day)', 3],
    ['dayOfMonth(day)', 15],
    ['date("2026-01-02")', Date.parse('2026-01-02T00:00:00.000Z')],
    ['day > date("2026-01-02")', true],
    ['addDays(empty, 1)', null],
    ['year(empty)', null],
    ['date("nonsense")', null],
    ['date(empty)', null],
  ])('computes %s', (expression, expected) => {
    expect(evaluate(expression, { day: DAY, empty: null })).toEqual(expected);
  });

  it('keeps the end of the month when adding months overflows', () => {
    expect(
      evaluate('addMonths(day, 1)', {
        day: Date.parse('2026-01-31T00:00:00.000Z'),
      }),
    ).toEqual(Date.parse('2026-02-28T00:00:00.000Z'));
  });
});

describe('coerceFormulaResult for the richer outputs', () => {
  it.each([
    [DAY, FieldMetadataType.DATE, '2026-03-15'],
    ['2026-03-15', FieldMetadataType.DATE, '2026-03-15'],
    [DAY, FieldMetadataType.DATE_TIME, '2026-03-15T12:30:00.000Z'],
    [Number.NaN, FieldMetadataType.DATE, null],
    [null, FieldMetadataType.DATE_TIME, null],
  ] as const)('coerces %s to %s', (value, outputType, expected) => {
    expect(coerceFormulaResult(value, outputType)).toEqual({
      status: 'success',
      value: expected,
    });
  });

  it.each([
    ['nonsense', FieldMetadataType.DATE],
    [true, FieldMetadataType.DATE_TIME],
    ['text', FieldMetadataType.CURRENCY],
  ] as const)('rejects %s as %s', (value, outputType) => {
    expect(coerceFormulaResult(value, outputType).status).toBe('error');
  });

  it('accepts only the options of a select', () => {
    const optionValues = ['HIGH', 'LOW'];

    expect(
      coerceFormulaResult('HIGH', FieldMetadataType.SELECT, { optionValues }),
    ).toEqual({ status: 'success', value: 'HIGH' });
    expect(
      coerceFormulaResult('high', FieldMetadataType.SELECT, { optionValues })
        .status,
    ).toBe('error');
    expect(
      coerceFormulaResult('', FieldMetadataType.SELECT, { optionValues }),
    ).toEqual({ status: 'success', value: null });
  });

  it('turns a number into a currency amount', () => {
    expect(
      coerceFormulaResult(2500.5, FieldMetadataType.CURRENCY, {
        currencyCode: 'SAR',
      }),
    ).toEqual({
      status: 'success',
      value: { amountMicros: 2500500000, currencyCode: 'SAR' },
    });
    expect(coerceFormulaResult(Number.NaN, FieldMetadataType.CURRENCY)).toEqual(
      { status: 'success', value: null },
    );
  });
});

// A record that looks changed on every run is what caused the sync field's endless job loop.
describe('isFormulaValueUnchanged for the richer outputs', () => {
  const currency = { amountMicros: 2500000000, currencyCode: 'SAR' };

  it.each([
    ['2026-03-15', '2026-03-15', FieldMetadataType.DATE],
    [new Date('2026-03-15T00:00:00Z'), '2026-03-15', FieldMetadataType.DATE],
    [null, null, FieldMetadataType.DATE],
    [
      new Date('2026-03-15T12:30:00Z'),
      '2026-03-15T12:30:00.000Z',
      FieldMetadataType.DATE_TIME,
    ],
    [
      '2026-03-15T12:30:00+00:00',
      '2026-03-15T12:30:00.000Z',
      FieldMetadataType.DATE_TIME,
    ],
    ['HIGH', 'HIGH', FieldMetadataType.SELECT],
    [null, null, FieldMetadataType.SELECT],
    [currency, currency, FieldMetadataType.CURRENCY],
    [
      { amountMicros: '2500000000', currencyCode: 'SAR' },
      currency,
      FieldMetadataType.CURRENCY,
    ],
    [
      { amountMicros: null, currencyCode: null },
      null,
      FieldMetadataType.CURRENCY,
    ],
    [
      { amountMicros: null, currencyCode: '' },
      null,
      FieldMetadataType.CURRENCY,
    ],
    [null, null, FieldMetadataType.CURRENCY],
  ] as const)(
    '%j and %j are unchanged as %s',
    (stored, computed, outputType) => {
      expect(isFormulaValueUnchanged(stored, computed, outputType)).toBe(true);
    },
  );

  it.each([
    ['2026-03-15', '2026-03-16', FieldMetadataType.DATE],
    [null, '2026-03-16', FieldMetadataType.DATE],
    ['2026-03-15', null, FieldMetadataType.DATE],
    [
      '2026-03-15T12:30:00.000Z',
      '2026-03-15T12:31:00.000Z',
      FieldMetadataType.DATE_TIME,
    ],
    ['HIGH', 'LOW', FieldMetadataType.SELECT],
    [currency, { ...currency, amountMicros: 1 }, FieldMetadataType.CURRENCY],
    [
      currency,
      { ...currency, currencyCode: 'USD' },
      FieldMetadataType.CURRENCY,
    ],
    [currency, null, FieldMetadataType.CURRENCY],
    [
      { amountMicros: null, currencyCode: null },
      currency,
      FieldMetadataType.CURRENCY,
    ],
  ] as const)('%j and %j differ as %s', (stored, computed, outputType) => {
    expect(isFormulaValueUnchanged(stored, computed, outputType)).toBe(false);
  });
});

describe('formatDuration', () => {
  it.each([
    [3.1666666666666665, 'days', '3d 4h'],
    [14, 'days', '14d'],
    [0.5, 'days', '12h'],
    [90, 'minutes', '1h 30m'],
    [1.5, 'hours', '1h 30m'],
    [45, 'seconds', '45s'],
    [1500, 'milliseconds', '1s'],
    [250, 'milliseconds', '250ms'],
    [0, 'days', '0'],
    [-2, 'days', '-2d'],
    [-1.5, 'hours', '-1h 30m'],
  ] as const)('formats %s %s as %s', (value, unit, expected) => {
    expect(formatDuration(value, unit)).toBe(expected);
  });

  it('defaults to days', () => {
    expect(formatDuration(2)).toBe('2d');
  });
});

describe('null', () => {
  it('means empty and is not treated as a field', () => {
    expect(parseFormula('price > 1 ? price : null')).toEqual({
      status: 'valid',
      fieldNames: ['price'],
      functionNames: [],
    });
    expect(evaluate('price > 1 ? price : null', { price: 0 })).toBeUndefined();
    expect(
      coerceFormulaResult(
        evaluate('price > 1 ? price : null', { price: 0 }),
        FieldMetadataType.NUMBER,
      ),
    ).toEqual({ status: 'success', value: null });
  });
});

describe('syntax hints', () => {
  it.each([
    ['addDays(day, -15)', 'write 0 - value'],
    ['-price + 1', 'write 0 - value'],
    ['between(price, 1, 2) ? 1 : 0', 'parentheses'],
  ])('explains how to fix %s', (expression, hint) => {
    expect(evaluate(expression)).toEqual({
      status: 'error',
      error: expect.stringContaining(hint),
    });
  });
});

describe('FORMULA_FUNCTION_SIGNATURES', () => {
  it('documents every registered function, for the editor dropdown', () => {
    expect(Object.keys(FORMULA_FUNCTION_SIGNATURES).sort()).toEqual(
      Object.keys(FORMULA_FUNCTIONS).sort(),
    );
  });
});
