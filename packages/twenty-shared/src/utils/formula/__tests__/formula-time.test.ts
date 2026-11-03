import { evaluateFormula } from '@/utils/formula/evaluateFormula';
import { isFormulaTimeBased } from '@/utils/formula/isFormulaTimeBased';

const NOW = Date.UTC(2026, 2, 15, 10, 40, 30);
const CURRENT_HOUR = Date.UTC(2026, 2, 15, 10);

const evaluate = (expression: string, variables = {}) => {
  const evaluation = evaluateFormula(expression, variables);

  return evaluation.status === 'success' ? evaluation.value : evaluation.error;
};

describe('time functions', () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: NOW });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('snaps now() to the hour', () => {
    expect(evaluate('now()')).toBe(CURRENT_HOUR);
  });

  it('gives the same value throughout an hour', () => {
    const first = evaluate('now()');

    jest.setSystemTime(Date.UTC(2026, 2, 15, 10, 59, 59));

    expect(evaluate('now()')).toBe(first);
  });

  it.each([
    ['daysSince(start)', Date.UTC(2026, 2, 10, 10), 5],
    ['daysSince(start)', Date.UTC(2026, 2, 10, 11), 4],
    ['daysSince(start)', Date.UTC(2026, 2, 20), -5],
    ['daysUntil(start)', Date.UTC(2026, 2, 20, 10), 5],
    ['daysUntil(start)', Date.UTC(2026, 2, 20, 9), 4],
    ['hoursSince(start)', Date.UTC(2026, 2, 15, 7), 3],
    ['hoursUntil(start)', Date.UTC(2026, 2, 15, 13), 3],
  ])('%s from %i is the whole number %i', (expression, start, expected) => {
    expect(evaluate(expression, { start })).toBe(expected);
  });

  it.each(['daysSince', 'daysUntil', 'hoursSince', 'hoursUntil'])(
    '%s of an empty date is empty, not a huge number',
    (functionName) => {
      expect(evaluate(`${functionName}(start)`, { start: null })).toBeNull();
    },
  );

  it('works with the other date functions', () => {
    expect(evaluate('year(now())')).toBe(2026);
    expect(evaluate('daysBetween(now(), addDays(now(), 0 - 2))')).toBe(2);
  });
});

describe('isFormulaTimeBased', () => {
  it.each([
    ['now()', true],
    ['daysSince(start) > 30', true],
    ['if(flag, hoursUntil(end), 0)', true],
    ['daysBetween(end, start)', false],
    ['now', false],
    ['"now()"', false],
    ['now(', false],
  ])('%s is %s', (expression, expected) => {
    expect(isFormulaTimeBased(expression)).toBe(expected);
  });
});
