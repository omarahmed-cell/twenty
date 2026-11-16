import { useAggregateRecords } from '@/object-record/hooks/useAggregateRecords';
import { AggregateOperations } from '@/object-record/record-table/constants/AggregateOperations';
import {
  CoreObjectNameSingular,
  type RecordGqlOperationFilter,
} from 'twenty-shared/types';

// Trashed deals still hold the value, so they count too
export const useSettingsPipelineDealCount = ({
  fieldName,
  value,
}: {
  fieldName: 'pipeline' | 'stage';
  value: string;
}): number | undefined => {
  const filter: RecordGqlOperationFilter = {
    or: [
      { [fieldName]: { in: [value] } },
      {
        and: [
          { [fieldName]: { in: [value] } },
          { deletedAt: { is: 'NOT_NULL' } },
        ],
      },
    ],
  };

  const { data, loading } = useAggregateRecords<{ id: { COUNT: number } }>({
    objectNameSingular: CoreObjectNameSingular.Opportunity,
    filter,
    recordGqlFieldsAggregate: { id: [AggregateOperations.COUNT] },
  });

  return loading ? undefined : (data?.id?.COUNT ?? 0);
};
