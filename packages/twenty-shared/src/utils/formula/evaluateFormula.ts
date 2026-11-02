import { FORMULA_ENGINE } from '@/utils/formula/formulaEngine';
import { parseFormula } from '@/utils/formula/parseFormula';

export type FormulaEvaluation =
  | { status: 'success'; value: unknown }
  | { status: 'error'; error: string };

export const evaluateFormula = (
  expression: string,
  variables: Record<string, unknown>,
): FormulaEvaluation => {
  const parsedFormula = parseFormula(expression);

  if (parsedFormula.status === 'invalid') {
    return { status: 'error', error: parsedFormula.error };
  }

  try {
    return {
      status: 'success',
      value: FORMULA_ENGINE.evalSync(expression, variables),
    };
  } catch (error) {
    return {
      status: 'error',
      error: error instanceof Error ? error.message : String(error),
    };
  }
};
