import { getActorFilterChipLabelValue } from '@/object-record/object-filter-dropdown/utils/getActorFilterChipLabelValue';
import { ViewFilterOperand } from 'twenty-shared/types';

describe('getActorFilterChipLabelValue', () => {
  it('should read as the part, the operand and the value', () => {
    expect(
      getActorFilterChipLabelValue({
        subFieldLabel: 'User',
        operand: ViewFilterOperand.IS,
        displayValue: 'Ana',
      }),
    ).toBe(': User is Ana');
    expect(
      getActorFilterChipLabelValue({
        subFieldLabel: 'Source',
        operand: ViewFilterOperand.IS_NOT,
        displayValue: 'API',
      }),
    ).toBe(': Source is not API');
    expect(
      getActorFilterChipLabelValue({
        subFieldLabel: 'Name',
        operand: ViewFilterOperand.CONTAINS,
        displayValue: 'x',
      }),
    ).toBe(': Name contains x');
  });

  it('should leave the value out for emptiness operands', () => {
    expect(
      getActorFilterChipLabelValue({
        subFieldLabel: 'User',
        operand: ViewFilterOperand.IS_EMPTY,
        displayValue: '',
      }),
    ).toBe(': User is empty');
  });
});
