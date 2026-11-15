import {
  ViewFilterOperand as RecordFilterOperand,
  type RecordFilterValueDependencies,
  type RecordGqlOperationFilter,
} from '@/types';
import { computeRelationGqlFieldJoinColumnName } from '@/utils/fieldMetadata/compute-relation-gql-field-join-column-name';
import { computeRelationFilterRecordIds } from '@/utils/filter/computeRelationFilterRecordIds';
import { type RecordFilter } from '@/utils/filter/turnRecordFilterGroupIntoGqlOperationFilter';

const LIVE_JUNCTION_RECORD_FILTER = { deletedAt: { is: 'NULL' } };

// Filters on a many-to-many field match the records that have a junction row for the selected targets
export const turnJunctionRelationFilterIntoGqlOperationFilter = ({
  recordFilter,
  junctionFieldName,
  junctionTargetFieldName,
  filterValueDependencies,
}: {
  recordFilter: Pick<RecordFilter, 'operand' | 'value'>;
  junctionFieldName: string;
  junctionTargetFieldName: string;
  filterValueDependencies: RecordFilterValueDependencies;
}): RecordGqlOperationFilter | undefined => {
  const hasAnyJunctionRecord = {
    [junctionFieldName]: LIVE_JUNCTION_RECORD_FILTER,
  } as RecordGqlOperationFilter;

  switch (recordFilter.operand) {
    case RecordFilterOperand.IS_EMPTY:
      return { not: hasAnyJunctionRecord };
    case RecordFilterOperand.IS_NOT_EMPTY:
      return hasAnyJunctionRecord;
  }

  const recordIds = computeRelationFilterRecordIds({
    value: recordFilter.value,
    filterValueDependencies,
  });

  if (recordIds.length === 0) {
    return undefined;
  }

  const hasMatchingJunctionRecord = {
    [junctionFieldName]: {
      and: [
        {
          [computeRelationGqlFieldJoinColumnName({
            name: junctionTargetFieldName,
          })]: { in: recordIds },
        },
        LIVE_JUNCTION_RECORD_FILTER,
      ],
    },
  } as RecordGqlOperationFilter;

  switch (recordFilter.operand) {
    case RecordFilterOperand.IS:
      return hasMatchingJunctionRecord;
    case RecordFilterOperand.IS_NOT:
      return { not: hasMatchingJunctionRecord };
    default:
      return undefined;
  }
};
