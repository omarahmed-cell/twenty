import { type RecordGqlOperationOrderBy } from 'twenty-shared/types';

// Sorts the note targets by the related note, so back-dated notes fall into place
export const NOTES_ORDER_BY: RecordGqlOperationOrderBy = [
  { note: { activityDate: 'DescNullsLast' } },
  { createdAt: 'DescNullsFirst' },
];
