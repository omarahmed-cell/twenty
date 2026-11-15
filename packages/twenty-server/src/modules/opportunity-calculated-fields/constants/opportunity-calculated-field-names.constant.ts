export const OPPORTUNITY_CALCULATED_FIELD_NAMES = [
  'lastActivityDate',
  'nextActivityDate',
  'numberOfAssociatedContacts',
  'numberOfAssociatedLineItems',
] as const;

export type OpportunityCalculatedFieldName =
  (typeof OPPORTUNITY_CALCULATED_FIELD_NAMES)[number];

export type OpportunityCalculatedFieldValues = Record<
  OpportunityCalculatedFieldName,
  number | string | null
>;
