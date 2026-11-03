import { FORMULA_TIME_FUNCTION_NAMES } from '@/utils/formula/formulaEngine';
import { parseFormula } from '@/utils/formula/parseFormula';

export const isFormulaTimeBased = (expression: string): boolean => {
  const parsedFormula = parseFormula(expression);

  return (
    parsedFormula.status === 'valid' &&
    parsedFormula.functionNames.some((functionName) =>
      FORMULA_TIME_FUNCTION_NAMES.includes(functionName),
    )
  );
};
