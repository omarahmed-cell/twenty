import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { getRoboostFilterableFields } from '@/roboost-app/filters/components/RoboostFilterRuleEditor';
import { useRoboostFieldGroups } from '@/roboost-app/list/hooks/useRoboostFieldGroups';
import { getRoboostScoreFieldIcon } from '@/roboost-app/scoring/utils/getRoboostScoreFieldIcon';
import { getRoboostScoreIdOfField } from '@/roboost-app/scoring/utils/getRoboostScoreIdOfField';
import { type SelectOption } from '@/roboost-ui/components/Select';
import { useLingui } from '@lingui/react/macro';

// Only the scored object's own properties, grouped like the record page. Score properties are left
// out: scores write without record events, so a score reading another would go stale
export const useRoboostScoreFields = (
  objectMetadataItem: EnrichedObjectMetadataItem,
  linkedFieldMetadataId: string | null,
) => {
  const { t } = useLingui();
  const groups = useRoboostFieldGroups(objectMetadataItem);
  const filterableFields = getRoboostFilterableFields(
    objectMetadataItem,
  ).filter(
    (field) =>
      field.id !== linkedFieldMetadataId &&
      getRoboostScoreIdOfField(field) === undefined,
  );
  const filterableIds = new Set(filterableFields.map((field) => field.id));
  const groupTitleByFieldId = new Map<string, string>();

  for (const group of groups) {
    for (const field of group.fields) {
      if (filterableIds.has(field.id) && !groupTitleByFieldId.has(field.id)) {
        groupTitleByFieldId.set(field.id, group.title);
      }
    }
  }
  const otherTitle = t`Other properties`;
  const groupOrder = [...groups.map((group) => group.title), otherTitle];
  const groupOf = (field: FieldMetadataItem) =>
    groupTitleByFieldId.get(field.id) ?? otherTitle;
  const fieldOptions: SelectOption[] = [...filterableFields]
    .sort(
      (first, second) =>
        groupOrder.indexOf(groupOf(first)) -
          groupOrder.indexOf(groupOf(second)) ||
        first.label.localeCompare(second.label),
    )
    .map((field) => ({
      value: field.name,
      label: field.label,
      group: groupOf(field),
      icon: getRoboostScoreFieldIcon(field),
    }));
  const fieldsByName = new Map(
    filterableFields.map((field) => [field.name, field]),
  );

  return { fieldOptions, fieldsByName };
};
