import jexl from 'jexl';

import { isDefined } from '@/utils/validation/isDefined';

const MILLISECONDS_PER_HOUR = 3_600_000;
const MILLISECONDS_PER_DAY = 86_400_000;

// Precedences must match jexl's defaults, since these replace its built-in operators.
const ARITHMETIC_OPERATORS: {
  operator: string;
  precedence: number;
  compute: (left: number, right: number) => unknown;
}[] = [
  { operator: '+', precedence: 30, compute: (left, right) => left + right },
  { operator: '-', precedence: 30, compute: (left, right) => left - right },
  { operator: '*', precedence: 40, compute: (left, right) => left * right },
  { operator: '/', precedence: 40, compute: (left, right) => left / right },
  {
    operator: '//',
    precedence: 40,
    compute: (left, right) => Math.floor(left / right),
  },
  { operator: '%', precedence: 50, compute: (left, right) => left % right },
  { operator: '^', precedence: 50, compute: (left, right) => left ** right },
];

const onDefinedNumbers =
  <TNumbers extends number[]>(compute: (...numbers: TNumbers) => number) =>
  (...values: TNumbers) =>
    values.every(isDefined) ? compute(...values) : null;

const toValidTimestamp = (value: unknown) => {
  const timestamp = new Date(value as string | number).getTime();

  return Number.isNaN(timestamp) ? null : timestamp;
};

const addUtcMonths = (timestamp: number, months: number) => {
  const date = new Date(timestamp);
  const dayOfMonth = date.getUTCDate();

  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + months);

  const lastDayOfMonth = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0),
  ).getUTCDate();

  date.setUTCDate(Math.min(dayOfMonth, lastDayOfMonth));

  return date.getTime();
};

const timeBetween =
  (unitInMilliseconds: number) => (left: number, right: number) =>
    (left - right) / unitInMilliseconds;

export const FORMULA_FUNCTIONS: Record<
  string,
  // oxlint-disable-next-line typescript/no-explicit-any
  (...values: any[]) => unknown
> = {
  if: (condition: unknown, whenTrue: unknown, whenFalse: unknown) =>
    condition ? whenTrue : whenFalse,
  between: (value: number | null, low: number, high: number) =>
    isDefined(value) ? value >= low && value <= high : false,
  isEmpty: (value: unknown) =>
    !isDefined(value) ||
    value === '' ||
    (Array.isArray(value) && value.length === 0),
  abs: onDefinedNumbers((value: number) => Math.abs(value)),
  round: (value: number | null, digits = 0) =>
    isDefined(value) ? Number(value.toFixed(digits)) : null,
  floor: onDefinedNumbers((value: number) => Math.floor(value)),
  ceil: onDefinedNumbers((value: number) => Math.ceil(value)),
  min: (...values: (number | null)[]) => {
    const numbers = values.filter(isDefined);

    return numbers.length > 0 ? Math.min(...numbers) : null;
  },
  max: (...values: (number | null)[]) => {
    const numbers = values.filter(isDefined);

    return numbers.length > 0 ? Math.max(...numbers) : null;
  },
  concat: (...values: unknown[]) => values.filter(isDefined).join(''),
  lower: (value: string | null) => value?.toLowerCase() ?? null,
  upper: (value: string | null) => value?.toUpperCase() ?? null,
  length: (value: string | unknown[] | null) => value?.length ?? 0,
  contains: (container: string | string[] | null, value: string) =>
    container?.includes(value) ?? false,
  daysBetween: onDefinedNumbers(timeBetween(MILLISECONDS_PER_DAY)),
  hoursBetween: onDefinedNumbers(timeBetween(MILLISECONDS_PER_HOUR)),
  date: (value: unknown) => (isDefined(value) ? toValidTimestamp(value) : null),
  addDays: onDefinedNumbers(
    (timestamp: number, days: number) =>
      timestamp + days * MILLISECONDS_PER_DAY,
  ),
  addHours: onDefinedNumbers(
    (timestamp: number, hours: number) =>
      timestamp + hours * MILLISECONDS_PER_HOUR,
  ),
  addMonths: onDefinedNumbers(addUtcMonths),
  year: onDefinedNumbers((timestamp: number) =>
    new Date(timestamp).getUTCFullYear(),
  ),
  month: onDefinedNumbers(
    (timestamp: number) => new Date(timestamp).getUTCMonth() + 1,
  ),
  dayOfMonth: onDefinedNumbers((timestamp: number) =>
    new Date(timestamp).getUTCDate(),
  ),
};

export const FORMULA_FUNCTION_SIGNATURES: Record<string, string> = {
  if: 'if(condition, whenTrue, whenFalse)',
  between: 'between(value, low, high)',
  isEmpty: 'isEmpty(value)',
  abs: 'abs(number)',
  round: 'round(number, digits)',
  floor: 'floor(number)',
  ceil: 'ceil(number)',
  min: 'min(a, b, ...)',
  max: 'max(a, b, ...)',
  concat: 'concat(a, b, ...)',
  lower: 'lower(text)',
  upper: 'upper(text)',
  length: 'length(textOrList)',
  contains: 'contains(textOrList, value)',
  daysBetween: 'daysBetween(later, earlier)',
  hoursBetween: 'hoursBetween(later, earlier)',
  date: 'date("2026-01-31")',
  addDays: 'addDays(date, days)',
  addHours: 'addHours(date, hours)',
  addMonths: 'addMonths(date, months)',
  year: 'year(date)',
  month: 'month(date)',
  dayOfMonth: 'dayOfMonth(date)',
};

const createFormulaEngine = () => {
  const engine = new jexl.Jexl();

  // Plain JavaScript would turn an empty field into 0 and silently produce a wrong number.
  for (const { operator, precedence, compute } of ARITHMETIC_OPERATORS) {
    engine.addBinaryOp(operator, precedence, (left, right) =>
      isDefined(left) && isDefined(right) ? compute(left, right) : null,
    );
  }

  for (const [name, formulaFunction] of Object.entries(FORMULA_FUNCTIONS)) {
    engine.addFunction(name, formulaFunction);
  }

  return engine;
};

export const FORMULA_ENGINE = createFormulaEngine();
