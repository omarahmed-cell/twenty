import { FieldMetadataType } from '@/types/FieldMetadataType';
import {
  type ConditionalLogicField,
  type ConditionalLogicOperator,
} from '@/utils/conditional-logic/conditional-logic-types';

const PRESENCE_OPERATORS: ConditionalLogicOperator[] = [
  'IS_KNOWN',
  'IS_UNKNOWN',
];

const NUMBER_OPERATORS: ConditionalLogicOperator[] = [
  'IS_EQUAL_TO',
  'IS_NOT_EQUAL_TO',
  'GREATER_THAN',
  'LESS_THAN',
  'GREATER_THAN_OR_EQUAL',
  'LESS_THAN_OR_EQUAL',
];

const DATE_OPERATORS: ConditionalLogicOperator[] = [
  'IS_BEFORE',
  'IS_AFTER',
  'IS_ON',
];

const OPERATORS_BY_FIELD_TYPE: Partial<
  Record<FieldMetadataType, ConditionalLogicOperator[]>
> = {
  [FieldMetadataType.TEXT]: ['IS_EQUAL_TO', 'IS_NOT_EQUAL_TO', 'CONTAINS'],
  [FieldMetadataType.SELECT]: ['IS_ANY_OF', 'IS_NONE_OF'],
  [FieldMetadataType.MULTI_SELECT]: [
    'CONTAINS_ANY_OF',
    'CONTAINS_ALL_OF',
    'CONTAINS_NONE_OF',
  ],
  [FieldMetadataType.NUMBER]: NUMBER_OPERATORS,
  [FieldMetadataType.NUMERIC]: NUMBER_OPERATORS,
  [FieldMetadataType.CURRENCY]: NUMBER_OPERATORS,
  [FieldMetadataType.DATE]: DATE_OPERATORS,
  [FieldMetadataType.DATE_TIME]: DATE_OPERATORS,
  [FieldMetadataType.BOOLEAN]: ['IS_YES', 'IS_NO'],
  [FieldMetadataType.RELATION]: ['IS_ANY_OF'],
};

export const getConditionalLogicOperators = (
  field: Pick<ConditionalLogicField, 'type'>,
): ConditionalLogicOperator[] => [
  ...(OPERATORS_BY_FIELD_TYPE[field.type] ?? []),
  ...(field.type === FieldMetadataType.BOOLEAN ? [] : PRESENCE_OPERATORS),
];

const VALUELESS_OPERATORS = new Set<ConditionalLogicOperator>([
  'IS_KNOWN',
  'IS_UNKNOWN',
  'IS_YES',
  'IS_NO',
]);

const LIST_OPERATORS = new Set<ConditionalLogicOperator>([
  'IS_ANY_OF',
  'IS_NONE_OF',
  'CONTAINS_ANY_OF',
  'CONTAINS_ALL_OF',
  'CONTAINS_NONE_OF',
]);

export const isConditionalLogicOperatorValueless = (
  operator: ConditionalLogicOperator,
) => VALUELESS_OPERATORS.has(operator);

export const isConditionalLogicListOperator = (
  operator: ConditionalLogicOperator,
) => LIST_OPERATORS.has(operator);
