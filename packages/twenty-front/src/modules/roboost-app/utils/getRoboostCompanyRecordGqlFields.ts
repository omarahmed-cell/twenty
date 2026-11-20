import { type RoboostCompanyColumn } from '@/roboost-app/constants/RoboostCompanyColumns';
import { type RecordGqlFields } from 'twenty-shared/types';

export const getRoboostCompanyRecordGqlFields = (
  columns: RoboostCompanyColumn[],
): RecordGqlFields => {
  const recordGqlFields: RecordGqlFields = { id: true, name: true };

  for (const column of columns) {
    recordGqlFields[column.fieldName] =
      column.kind === 'member'
        ? { id: true, name: true, avatarUrl: true }
        : true;
  }

  return recordGqlFields;
};
