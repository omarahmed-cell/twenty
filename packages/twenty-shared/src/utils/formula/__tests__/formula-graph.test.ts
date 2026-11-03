import { FieldMetadataType } from '@/types/FieldMetadataType';
import {
  type ComputedGraphField,
  findComputedFieldCycleMembers,
} from '@/utils/formula/findComputedFieldCycleMembers';
import { renameFormulaField } from '@/utils/formula/renameFormulaField';

const plain = (
  name: string,
  objectMetadataId = 'deal',
): ComputedGraphField => ({
  id: `${objectMetadataId}.${name}`,
  name,
  objectMetadataId,
  type: FieldMetadataType.NUMBER,
});

const formula = (
  name: string,
  expression: string,
  objectMetadataId = 'deal',
  overrides: Partial<ComputedGraphField> = {},
): ComputedGraphField => ({
  ...plain(name, objectMetadataId),
  settings: { formula: { expression } },
  ...overrides,
});

const sync = (
  name: string,
  sourceFieldMetadataId: string,
  objectMetadataId: string,
): ComputedGraphField => ({
  ...plain(name, objectMetadataId),
  type: FieldMetadataType.TEXT,
  settings: {
    sync: { relationFieldMetadataId: 'relation', sourceFieldMetadataId },
  },
});

const cycleMembers = (...fields: ComputedGraphField[]) =>
  [...findComputedFieldCycleMembers(fields)].sort();

describe('findComputedFieldCycleMembers', () => {
  it('finds no loop in a chain', () => {
    expect(
      cycleMembers(
        plain('price'),
        formula('first', 'price * 2'),
        formula('second', 'first + 1'),
        formula('third', 'first + second'),
      ),
    ).toEqual([]);
  });

  it('finds a field that references itself', () => {
    expect(cycleMembers(formula('total', 'total + 1'))).toEqual(['deal.total']);
  });

  it('finds a loop between two formulas', () => {
    expect(
      cycleMembers(
        formula('first', 'second + 1'),
        formula('second', 'first + 1'),
      ),
    ).toEqual(['deal.first', 'deal.second']);
  });

  it('finds a loop that crosses objects through sync fields', () => {
    expect(
      cycleMembers(
        formula('companyFormula', 'companySync + 1', 'company'),
        sync('dealSync', 'company.companyFormula', 'deal'),
        formula('dealFormula', 'dealSync + 1', 'deal'),
        sync('companySync', 'deal.dealFormula', 'company'),
      ),
    ).toEqual([
      'company.companyFormula',
      'company.companySync',
      'deal.dealFormula',
      'deal.dealSync',
    ]);
  });

  it('does not count a field that only depends on a loop', () => {
    expect(
      cycleMembers(
        formula('first', 'second + 1'),
        formula('second', 'first + 1'),
        formula('downstream', 'first + 1'),
      ),
    ).toEqual(['deal.first', 'deal.second']);
  });

  it('does not connect same-named fields on different objects', () => {
    expect(
      cycleMembers(
        formula('total', 'price + 1', 'deal'),
        formula('price', 'total + 1', 'company'),
        plain('price', 'deal'),
        plain('total', 'company'),
      ),
    ).toEqual([]);
  });

  it('ignores inactive fields, which break the loop', () => {
    expect(
      cycleMembers(
        formula('first', 'second + 1'),
        formula('second', 'first + 1', 'deal', { isActive: false }),
      ),
    ).toEqual([]);
  });

  it('ignores formula settings on an unsupported type and invalid formulas', () => {
    expect(
      cycleMembers(
        formula('rating', 'rating + 1', 'deal', {
          type: FieldMetadataType.RATING,
        }),
        formula('broken', 'broken +'),
      ),
    ).toEqual([]);
  });
});

describe('renameFormulaField', () => {
  it.each([
    ['price * 2', 'cost * 2'],
    ['price+price', 'cost+cost'],
    ['round(price, 2)', 'round(cost, 2)'],
    ['price.amount * 2', 'cost.amount * 2'],
    ['x ? price : 0', 'x ? cost : 0'],
    ['"a" == "b" ? price : 0', '"a" == "b" ? cost : 0'],
  ])('renames the field in %s', (expression, expected) => {
    expect(renameFormulaField(expression, 'price', 'cost')).toBe(expected);
  });

  it.each([
    ['"price"'],
    ["'price'"],
    ['"a\\"price"'],
    ['other.price'],
    ['other . price'],
    ['price(1)'],
    ['price (1)'],
    ['priced + reprice'],
  ])('leaves %s untouched', (expression) => {
    expect(renameFormulaField(expression, 'price', 'cost')).toBe(expression);
  });
});
