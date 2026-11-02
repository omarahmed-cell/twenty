import { isNonEmptyString } from '@sniptt/guards';

import {
  FORMULA_ENGINE,
  FORMULA_FUNCTIONS,
} from '@/utils/formula/formulaEngine';

const FORMULA_MAX_LENGTH = 5000;

const FORBIDDEN_NAMES = new Set(['constructor', '__proto__', 'prototype']);

const FORMULA_FUNCTION_NAMES = new Set(Object.keys(FORMULA_FUNCTIONS));

type FormulaAstNode = {
  type?: string;
  value?: unknown;
  from?: unknown;
  name?: string;
  pool?: string;
};

export type ParsedFormula =
  | { status: 'valid'; fieldNames: string[]; functionNames: string[] }
  | { status: 'invalid'; error: string };

// jexl accepts an unclosed "(" and only rejects a stray ")", so this checks what it misses.
const hasUnclosedParenthesis = (expression: string) => {
  let depth = 0;
  let openQuote: string | null = null;

  for (let index = 0; index < expression.length; index += 1) {
    const character = expression[index];

    if (openQuote !== null) {
      if (character === '\\') {
        index += 1;
      } else if (character === openQuote) {
        openQuote = null;
      }
    } else if (character === '"' || character === "'") {
      openQuote = character;
    } else if (character === '(') {
      depth += 1;
    } else if (character === ')') {
      depth -= 1;
    }
  }

  return depth > 0;
};

const walk = (node: unknown, visit: (node: FormulaAstNode) => void) => {
  if (typeof node !== 'object' || node === null) {
    return;
  }

  if (!Array.isArray(node)) {
    visit(node);
  }

  for (const child of Object.values(node)) {
    walk(child, visit);
  }
};

export const parseFormula = (expression: string): ParsedFormula => {
  if (!isNonEmptyString(expression.trim())) {
    return { status: 'invalid', error: 'The formula is empty.' };
  }

  if (expression.length > FORMULA_MAX_LENGTH) {
    return {
      status: 'invalid',
      error: `The formula is longer than ${FORMULA_MAX_LENGTH} characters.`,
    };
  }

  if (hasUnclosedParenthesis(expression)) {
    return { status: 'invalid', error: 'A parenthesis is not closed.' };
  }

  let ast: unknown;

  try {
    // jexl only exposes the parse tree through this private method, hence the pinned version.
    ast = (
      FORMULA_ENGINE.compile(expression) as unknown as {
        _getAst: () => unknown;
      }
    )._getAst();
  } catch (error) {
    return {
      status: 'invalid',
      error: error instanceof Error ? error.message : String(error),
    };
  }

  const fieldNames = new Set<string>();
  const functionNames = new Set<string>();
  const errors: string[] = [];

  walk(ast, (node) => {
    if (
      (node.type === 'Identifier' || node.type === 'Literal') &&
      typeof node.value === 'string' &&
      FORBIDDEN_NAMES.has(node.value)
    ) {
      errors.push(`"${node.value}" is not allowed.`);
    }

    if (
      node.type === 'Identifier' &&
      typeof node.value === 'string' &&
      node.from === undefined
    ) {
      fieldNames.add(node.value);
    }

    if (node.type === 'FunctionCall' && isNonEmptyString(node.name)) {
      if (node.pool === 'transforms') {
        errors.push(`The "|" operator is not supported ("${node.name}").`);
      } else if (!FORMULA_FUNCTION_NAMES.has(node.name)) {
        errors.push(`Unknown function "${node.name}".`);
      } else {
        functionNames.add(node.name);
      }
    }
  });

  const [firstError] = errors;

  if (firstError !== undefined) {
    return { status: 'invalid', error: firstError };
  }

  return {
    status: 'valid',
    fieldNames: [...fieldNames],
    functionNames: [...functionNames],
  };
};
