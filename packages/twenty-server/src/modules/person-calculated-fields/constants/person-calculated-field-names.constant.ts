export const PERSON_CALCULATED_FIELD_NAMES = [
  'lastActivityDate',
  'firstDealCreatedDate',
  'timeInCurrentStage',
  'nextActivityDate',
] as const;

export type PersonCalculatedFieldName =
  (typeof PERSON_CALCULATED_FIELD_NAMES)[number];

export type PersonCalculatedFieldValues = Record<
  PersonCalculatedFieldName,
  number | string | null
>;
