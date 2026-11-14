export const COMPANY_CALCULATED_FIELD_NAMES = [
  'isParentCompany',
  'isChildCompany',
  'numberOfChildCompanies',
  'numberOfAssociatedContacts',
  'numberOfAssociatedDeals',
  'numberOfOpenDeals',
  'lastActivityDate',
] as const;

export type CompanyCalculatedFieldName =
  (typeof COMPANY_CALCULATED_FIELD_NAMES)[number];

export type CompanyCalculatedFieldValues = Record<
  CompanyCalculatedFieldName,
  boolean | number | string | null
>;
