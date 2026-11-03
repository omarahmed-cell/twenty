import {
  getFormulaComparedValues,
  renameFormulaOptionValues,
} from '@/utils/formula/formulaOptionValues';

const RENAMES = [{ from: 'RETAIL', to: 'SHOP' }];

describe('renameFormulaOptionValues on a compared field', () => {
  it.each([
    ['line == "RETAIL"', 'line == "SHOP"'],
    ['"RETAIL" == line', '"SHOP" == line'],
    ['line != "RETAIL"', 'line != "SHOP"'],
    ["line == 'RETAIL'", "line == 'SHOP'"],
    ['(line) == "RETAIL"', '(line) == "SHOP"'],
    ['line in ["RETAIL", "OTHER"]', 'line in ["SHOP", "OTHER"]'],
    ['"RETAIL" in line', '"SHOP" in line'],
    ['contains(line, "RETAIL")', 'contains(line, "SHOP")'],
    ['if(line == "RETAIL", 1, 2)', 'if(line == "SHOP", 1, 2)'],
    [
      'line == "RETAIL" && other > 1 ? 1 : 2',
      'line == "SHOP" && other > 1 ? 1 : 2',
    ],
    ['line == (flag ? "RETAIL" : "OTHER")', 'line == (flag ? "SHOP" : "OTHER")'],
  ])('rewrites %s', (expression, expected) => {
    expect(
      renameFormulaOptionValues({
        expression,
        renames: RENAMES,
        comparedFieldName: 'line',
      }),
    ).toBe(expected);
  });

  it.each([
    ['other == "RETAIL"'],
    ['line == "RETAIL OUTLET"'],
    ['line.name == "RETAIL"'],
    ['concat("RETAIL", line)'],
    ['lower(line) == "RETAIL"'],
    ['flag ? "RETAIL" : line'],
  ])('leaves %s alone', (expression) => {
    expect(
      renameFormulaOptionValues({
        expression,
        renames: RENAMES,
        comparedFieldName: 'line',
      }),
    ).toBe(expression);
  });

  it('keeps a text result that spells the same word', () => {
    expect(
      renameFormulaOptionValues({
        expression: 'line == "RETAIL" ? "RETAIL" : "OTHER"',
        renames: RENAMES,
        comparedFieldName: 'line',
      }),
    ).toBe('line == "SHOP" ? "RETAIL" : "OTHER"');
  });

  it('finds the right literal when earlier ones share its value', () => {
    expect(
      renameFormulaOptionValues({
        expression: 'concat("RETAIL") == "x" ? 1 : line == "RETAIL" ? 2 : 3',
        renames: RENAMES,
        comparedFieldName: 'line',
      }),
    ).toBe('concat("RETAIL") == "x" ? 1 : line == "SHOP" ? 2 : 3');
  });

  it('applies a swap in one pass', () => {
    expect(
      renameFormulaOptionValues({
        expression: 'line == "A" || line == "B"',
        renames: [
          { from: 'A', to: 'B' },
          { from: 'B', to: 'A' },
        ],
        comparedFieldName: 'line',
      }),
    ).toBe('line == "B" || line == "A"');
  });

  it('leaves a formula it cannot parse alone', () => {
    expect(
      renameFormulaOptionValues({
        expression: 'line == == "RETAIL"',
        renames: RENAMES,
        comparedFieldName: 'line',
      }),
    ).toBe('line == == "RETAIL"');
  });
});

describe('renameFormulaOptionValues on results', () => {
  it.each([
    ['"RETAIL"', '"SHOP"'],
    ['price > 1 ? "RETAIL" : "OTHER"', 'price > 1 ? "SHOP" : "OTHER"'],
    ['if(price > 1, "OTHER", "RETAIL")', 'if(price > 1, "OTHER", "SHOP")'],
    [
      'price > 2 ? "A" : price > 1 ? "RETAIL" : "B"',
      'price > 2 ? "A" : price > 1 ? "SHOP" : "B"',
    ],
    ['kind == "RETAIL" ? "RETAIL" : "B"', 'kind == "RETAIL" ? "SHOP" : "B"'],
  ])('rewrites %s', (expression, expected) => {
    expect(
      renameFormulaOptionValues({
        expression,
        renames: RENAMES,
        includeResults: true,
      }),
    ).toBe(expected);
  });
});

describe('getFormulaComparedValues', () => {
  it('lists what a field is compared against', () => {
    expect(
      getFormulaComparedValues(
        'line == "A" ? "B" : line in ["C", "D"] ? other : "E"',
        'line',
      ),
    ).toEqual(['A', 'C', 'D']);
  });

  it('is empty for a formula it cannot parse', () => {
    expect(getFormulaComparedValues('line == ==', 'line')).toEqual([]);
  });
});
