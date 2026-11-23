import { ViewFilterOperand } from 'twenty-shared/types';

import { capitalize } from 'twenty-shared/utils';
import {
  getOperandLabel,
  getOperandLabelShort,
} from '@/object-record/object-filter-dropdown/utils/getOperandLabel';

describe('getOperandLabel', () => {
  const testCases = [
    [ViewFilterOperand.CONTAINS, 'contains any of'],
    [ViewFilterOperand.DOES_NOT_CONTAIN, "doesn't contain any of"],
    [ViewFilterOperand.GREATER_THAN_OR_EQUAL, 'is more than or equal to'],
    [ViewFilterOperand.LESS_THAN_OR_EQUAL, 'is less than or equal to'],
    [ViewFilterOperand.IS, 'is equal to'],
    [ViewFilterOperand.IS_NOT, 'is not equal to'],
    [ViewFilterOperand.IS_NOT_NULL, 'is known'],
    [undefined, ''], // undefined operand
  ];

  it('reads list filters as any of / none of', () => {
    expect(getOperandLabel(ViewFilterOperand.IS, null, 'SELECT')).toBe(
      'is any of',
    );
    expect(getOperandLabel(ViewFilterOperand.IS_NOT, null, 'RELATION')).toBe(
      'is none of',
    );
  });

  testCases.forEach(([operand, expectedLabel]) => {
    const formattedOperand = capitalize(operand || 'undefined');

    it(`should return correct label for ViewFilterOperand.${formattedOperand}`, () => {
      const result = getOperandLabel(operand as ViewFilterOperand);
      expect(result).toBe(expectedLabel);
    });
  });
});

describe('getOperandLabelShort', () => {
  const testCases = [
    [ViewFilterOperand.IS, ': '],
    [ViewFilterOperand.CONTAINS, ': '],
    [ViewFilterOperand.IS_NOT, ': Not'],
    [ViewFilterOperand.DOES_NOT_CONTAIN, ': Not'],
    [ViewFilterOperand.IS_NOT_NULL, ': is known'],
    [ViewFilterOperand.GREATER_THAN_OR_EQUAL, '\u00A0≥ '],
    [ViewFilterOperand.LESS_THAN_OR_EQUAL, '\u00A0≤ '],
    [undefined, ': '], // undefined operand
  ];

  testCases.forEach(([operand, expectedLabel]) => {
    const formattedOperand = capitalize(operand || 'undefined');

    it(`should return correct short label for ViewFilterOperand.${formattedOperand}`, () => {
      const result = getOperandLabelShort(operand as ViewFilterOperand);
      expect(result).toBe(expectedLabel);
    });
  });
});
