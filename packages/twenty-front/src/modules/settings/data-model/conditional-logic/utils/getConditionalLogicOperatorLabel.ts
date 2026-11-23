import { t } from '@lingui/core/macro';
import { type ConditionalLogicOperator } from 'twenty-shared/utils';

// HubSpot's wording, shared with the record-layout card logic and the Roboost list filters
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
      return t`contains any of`;
    case 'IS_ANY_OF':
      return t`is any of`;
    case 'IS_NONE_OF':
      return t`is none of`;
    case 'CONTAINS_ANY_OF':
      return t`is any of`;
    case 'CONTAINS_ALL_OF':
      return t`is all of`;
    case 'CONTAINS_NONE_OF':
      return t`is none of`;
    case 'GREATER_THAN':
      return t`is more than`;
    case 'LESS_THAN':
      return t`is less than`;
    case 'GREATER_THAN_OR_EQUAL':
      return t`is more than or equal to`;
    case 'LESS_THAN_OR_EQUAL':
      return t`is less than or equal to`;
    case 'IS_BEFORE':
      return t`is before`;
    case 'IS_AFTER':
      return t`is after`;
    case 'IS_ON':
      return t`is`;
    case 'IS_YES':
      return t`is equal to Yes`;
    case 'IS_NO':
      return t`is equal to No`;
  }
};
