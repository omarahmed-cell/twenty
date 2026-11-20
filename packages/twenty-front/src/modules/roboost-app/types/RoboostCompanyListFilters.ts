export type RoboostDateRange =
  | 'any'
  | 'last7'
  | 'last30'
  | 'last90'
  | 'last365';

export type RoboostCompanyListFilters = {
  // 'any', 'me', 'none' or a workspace member id
  ownerId: string;
  createdWithin: RoboostDateRange;
  lastActivityWithin: RoboostDateRange;
  selectValuesByFieldName: Record<string, string[]>;
  extraSelectFieldNames: string[];
};

export const EMPTY_ROBOOST_COMPANY_LIST_FILTERS: RoboostCompanyListFilters = {
  ownerId: 'any',
  createdWithin: 'any',
  lastActivityWithin: 'any',
  selectValuesByFieldName: {},
  extraSelectFieldNames: [],
};
