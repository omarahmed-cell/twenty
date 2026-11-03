import { isDefined } from '@/utils/validation/isDefined';

import { FORMULA_ENGINE } from '@/utils/formula/formulaEngine';

type FormulaNode = {
  type: string;
  operator?: string;
  name?: string;
  value?: unknown;
  from?: FormulaNode;
  relative?: boolean;
  test?: FormulaNode;
  consequent?: FormulaNode | null;
  alternate?: FormulaNode;
  left?: FormulaNode;
  right?: FormulaNode;
  args?: FormulaNode[];
};

type FormulaStringLiteral = FormulaNode & { value: string };

// Source order, which the parse tree's own key order does not guarantee.
const CHILD_KEYS = [
  'from',
  'subject',
  'expr',
  'test',
  'consequent',
  'alternate',
  'left',
  'right',
  'args',
  'value',
] as const;

const COMPARISON_OPERATORS = new Set(['==', '!=', 'in']);

// Same reach as jexl's string token, so positions line up with the parse tree's literals.
const SOURCE_STRING_LITERAL = /"(?:\\"|[^"])*"|'(?:\\'|[^'])*'/g;

const getFormulaTree = (expression: string): FormulaNode | undefined => {
  try {
    return (
      FORMULA_ENGINE.compile(expression) as unknown as {
        _getAst: () => FormulaNode | undefined;
      }
    )._getAst();
  } catch {
    return undefined;
  }
};

const isFormulaNode = (value: unknown): value is FormulaNode =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as FormulaNode).type === 'string';

const getChildren = (node: FormulaNode): FormulaNode[] =>
  CHILD_KEYS.flatMap((key) => {
    const child = (node as Record<string, unknown>)[key];

    if (Array.isArray(child)) {
      return child;
    }

    return isFormulaNode(child) ? [child] : Object.values(child ?? {});
  }).filter(isFormulaNode);

const collectNodes = (node: FormulaNode): FormulaNode[] => [
  node,
  ...getChildren(node).flatMap(collectNodes),
];

const isStringLiteral = (node: FormulaNode): node is FormulaStringLiteral =>
  node.type === 'Literal' && typeof node.value === 'string';

// Literals the node evaluates to, as opposed to literals it only uses along the way.
const getResultLiterals = (
  node: FormulaNode | null | undefined,
): FormulaStringLiteral[] => {
  if (!isDefined(node)) {
    return [];
  }

  if (isStringLiteral(node)) {
    return [node];
  }

  if (node.type === 'ConditionalExpression') {
    return [node.consequent ?? node.test, node.alternate].flatMap(
      getResultLiterals,
    );
  }

  if (node.type === 'FunctionCall' && node.name === 'if') {
    return (node.args ?? []).slice(1).flatMap(getResultLiterals);
  }

  if (node.type === 'ArrayLiteral' && Array.isArray(node.value)) {
    return (node.value as FormulaNode[]).flatMap(getResultLiterals);
  }

  return [];
};

const isFieldReference = (
  node: FormulaNode | undefined,
  fieldName: string,
) =>
  node?.type === 'Identifier' &&
  node.value === fieldName &&
  !isDefined(node.from) &&
  node.relative !== true;

const getComparedLiterals = (
  tree: FormulaNode,
  fieldName: string,
): FormulaStringLiteral[] =>
  collectNodes(tree).flatMap((node) => {
    const [left, right] =
      node.type === 'FunctionCall' && node.name === 'contains'
        ? (node.args ?? [])
        : node.type === 'BinaryExpression' &&
            COMPARISON_OPERATORS.has(node.operator ?? '')
          ? [node.left, node.right]
          : [];

    return [
      ...(isFieldReference(left, fieldName) ? getResultLiterals(right) : []),
      ...(isFieldReference(right, fieldName) ? getResultLiterals(left) : []),
    ];
  });

export const getFormulaComparedValues = (
  expression: string,
  fieldName: string,
): string[] => {
  const tree = getFormulaTree(expression);

  return isDefined(tree)
    ? getComparedLiterals(tree, fieldName).map(({ value }) => value)
    : [];
};

// Only literals tied to the option change: the same word in a text result is left alone.
export const renameFormulaOptionValues = ({
  expression,
  renames,
  comparedFieldName,
  includeResults = false,
}: {
  expression: string;
  renames: { from: string; to: string }[];
  comparedFieldName?: string;
  includeResults?: boolean;
}): string => {
  const tree = getFormulaTree(expression);

  if (!isDefined(tree)) {
    return expression;
  }

  const literalsToRename = new Set<FormulaNode>([
    ...(isDefined(comparedFieldName)
      ? getComparedLiterals(tree, comparedFieldName)
      : []),
    ...(includeResults ? getResultLiterals(tree) : []),
  ]);

  const literalsInSourceOrder = collectNodes(tree).filter(isStringLiteral);
  const sourceLiterals = [...expression.matchAll(SOURCE_STRING_LITERAL)];

  if (literalsInSourceOrder.length !== sourceLiterals.length) {
    return expression;
  }

  let result = '';
  let position = 0;

  literalsInSourceOrder.forEach((literal, index) => {
    const sourceLiteral = sourceLiterals[index];
    const nextValue = renames.find(({ from }) => from === literal.value)?.to;

    if (
      !isDefined(sourceLiteral) ||
      !literalsToRename.has(literal) ||
      !isDefined(nextValue) ||
      sourceLiteral[0].slice(1, -1) !== literal.value
    ) {
      return;
    }

    const rawLiteral = sourceLiteral[0];
    const quote = rawLiteral.charAt(0);

    result += `${expression.slice(position, sourceLiteral.index)}${quote}${nextValue}${quote}`;
    position = sourceLiteral.index + rawLiteral.length;
  });

  return `${result}${expression.slice(position)}`;
};
