import { t } from '@lingui/core/macro';
import { type ConditionalLogicOperator } from 'twenty-shared/utils';

export const getConditionalLogicOperatorLabel = (
  operator: ConditionalLogicOperator,
): string => {
  switch (operator) {
    case 'IS_KNOWN':
      return t`is known`;
    case 'IS_UNKNOWN':
      return t`is unknown`;
    case 'IS_EQUAL_TO':
      return t`is equal to`;
    case 'IS_NOT_EQUAL_TO':
      return t`is not equal to`;
    case 'CONTAINS':
      return t`contains`;
    case 'IS_ANY_OF':
      return t`is any of`;
    case 'IS_NONE_OF':
      return t`is none of`;
    case 'CONTAINS_ANY_OF':
      return t`contains any of`;
    case 'CONTAINS_ALL_OF':
      return t`contains all of`;
    case 'CONTAINS_NONE_OF':
      return t`contains none of`;
    case 'GREATER_THAN':
      return t`is greater than`;
    case 'LESS_THAN':
      return t`is less than`;
    case 'GREATER_THAN_OR_EQUAL':
      return t`is greater than or equal to`;
    case 'LESS_THAN_OR_EQUAL':
      return t`is less than or equal to`;
    case 'IS_BEFORE':
      return t`is before`;
    case 'IS_AFTER':
      return t`is after`;
    case 'IS_ON':
      return t`is on`;
    case 'IS_YES':
      return t`is Yes`;
    case 'IS_NO':
      return t`is No`;
  }
};
