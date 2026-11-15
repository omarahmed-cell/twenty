import { type RecordFilterValueDependencies } from '@/types';
import { arrayOfUuidOrVariableSchema } from '@/utils/filter/utils/validation-schemas/arrayOfUuidsOrVariablesSchema';
import { jsonRelationFilterValueSchema } from '@/utils/filter/utils/validation-schemas/jsonRelationFilterValueSchema';
import { isDefined } from '@/utils/validation/isDefined';

export const computeRelationFilterRecordIds = ({
  value,
  filterValueDependencies,
}: {
  value: string;
  filterValueDependencies: RecordFilterValueDependencies;
}): string[] => {
  const {
    isCurrentWorkspaceMemberSelected,
    isCurrentRecordSelected,
    selectedRecordIds,
  } = jsonRelationFilterValueSchema
    .catch({
      isCurrentWorkspaceMemberSelected: false,
      isCurrentRecordSelected: false,
      selectedRecordIds: arrayOfUuidOrVariableSchema.parse(value),
    })
    .parse(value);

  return [
    ...selectedRecordIds,
    ...(isCurrentWorkspaceMemberSelected
      ? [filterValueDependencies?.currentWorkspaceMemberId]
      : []),
    ...(isCurrentRecordSelected
      ? [filterValueDependencies.currentRecord?.id]
      : []),
  ].filter(isDefined);
};
