import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { usePropertySettings } from '@/properties/hooks/usePropertySettings';
import { isRoboostListableField } from '@/roboost-app/list/hooks/useRoboostViewColumns';
import { useLingui } from '@lingui/react/macro';
import { isDefined } from 'twenty-shared/utils';

export type RoboostFieldGroup = {
  id: string;
  title: string;
  fields: FieldMetadataItem[];
};

// Fields grouped by the Properties module's groups; anything not in a group comes last
export const useRoboostFieldGroups = (
  objectMetadataItem: EnrichedObjectMetadataItem,
): RoboostFieldGroup[] => {
  const { t } = useLingui();
  const { propertySettings } = usePropertySettings();
  const listableFields = objectMetadataItem.fields.filter(
    isRoboostListableField,
  );
  const fieldsById = new Map(listableFields.map((field) => [field.id, field]));

  const groups: RoboostFieldGroup[] = (propertySettings?.groups ?? [])
    .filter((group) => group.objectMetadataId === objectMetadataItem.id)
    .sort((first, second) => first.position - second.position)
    .map((group) => ({
      id: group.id,
      title: group.name,
      fields: (propertySettings?.memberships ?? [])
        .filter((membership) => membership.propertyGroupId === group.id)
        .sort((first, second) => first.position - second.position)
        .map((membership) => fieldsById.get(membership.fieldMetadataId))
        .filter(isDefined),
    }))
    .filter((group) => group.fields.length > 0);

  const groupedIds = new Set(
    groups.flatMap((group) => group.fields.map((field) => field.id)),
  );
  const otherFields = listableFields
    .filter((field) => !groupedIds.has(field.id))
    .sort((first, second) => first.label.localeCompare(second.label));

  return otherFields.length > 0
    ? [
        ...groups,
        {
          id: 'other',
          title: groups.length > 0 ? t`Other properties` : t`Properties`,
          fields: otherFields,
        },
      ]
    : groups;
};
