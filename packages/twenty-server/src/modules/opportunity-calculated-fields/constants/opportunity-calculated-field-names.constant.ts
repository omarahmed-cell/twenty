export const OPPORTUNITY_CALCULATED_FIELD_NAMES = [
  'lastActivityDate',
  'nextActivityDate',
  'numberOfAssociatedContacts',
  'numberOfAssociatedLineItems',
  'dealProbability',
  'weightedAmount',
  'isClosed',
  'isClosedWon',
  'isClosedLost',
  'isOpen',
  'actualDuration',
  'exchangeRate',
  'exchangeRateMode',
  'amountInCompanyCurrency',
  'weightedAmountInCompanyCurrency',
] as const;

export type OpportunityCalculatedFieldName =
  (typeof OPPORTUNITY_CALCULATED_FIELD_NAMES)[number];

export type CurrencyValue = {
  amountMicros: number | null;
  currencyCode: string | null;
};

export type OpportunityCalculatedFieldValues = Record<
  OpportunityCalculatedFieldName,
  number | string | boolean | CurrencyValue | null
>;
