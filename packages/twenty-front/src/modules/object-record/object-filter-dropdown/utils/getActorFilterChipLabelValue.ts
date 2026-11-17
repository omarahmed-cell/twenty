import { t } from '@lingui/core/macro';
import { ViewFilterOperand } from 'twenty-shared/types';

export const getActorFilterChipLabelValue = ({
  subFieldLabel,
  operand,
  displayValue,
}: {
  subFieldLabel: string;
  operand: ViewFilterOperand;
  displayValue: string;
}): string => {
  switch (operand) {
    case ViewFilterOperand.IS:
      return t`: ${subFieldLabel} is ${displayValue}`;
    case ViewFilterOperand.IS_NOT:
      return t`: ${subFieldLabel} is not ${displayValue}`;
    case ViewFilterOperand.CONTAINS:
      return t`: ${subFieldLabel} contains ${displayValue}`;
    case ViewFilterOperand.DOES_NOT_CONTAIN:
      return t`: ${subFieldLabel} does not contain ${displayValue}`;
    case ViewFilterOperand.IS_EMPTY:
      return t`: ${subFieldLabel} is empty`;
    case ViewFilterOperand.IS_NOT_EMPTY:
      return t`: ${subFieldLabel} is not empty`;
    default:
      return `: ${subFieldLabel} ${displayValue}`;
  }
};
