import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { useFieldsWidgetGroups } from '@/page-layout/widgets/fields/hooks/useFieldsWidgetGroups';
import { usePropertySettings } from '@/properties/hooks/usePropertySettings';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { viewsSelector } from '@/views/states/selectors/viewsSelector';
import { ViewType } from '@/views/types/ViewType';
import { isDefined } from 'twenty-shared/utils';

export type RoboostPropertySection = {
  id: string;
  title: string;
  fields: FieldMetadataItem[];
};

// Fields the panel header already shows
const HEADER_FIELD_NAMES = new Set(['name', 'domainName', 'accountOwner']);

// Properties module groups first, then the record page's field groups for whatever is not grouped yet
export const useRoboostPropertySections = (
  objectMetadataItem: EnrichedObjectMetadataItem,
): RoboostPropertySection[] => {
  const { propertySettings } = usePropertySettings();
  const views = useAtomStateValue(viewsSelector);

  const fieldsWidgetView = views.find(
    (view) =>
      view.objectMetadataId === objectMetadataItem.id &&
      view.type === ViewType.FIELDS_WIDGET,
  );

  const { groups: fieldsWidgetGroups } = useFieldsWidgetGroups({
    viewId: fieldsWidgetView?.id ?? null,
    objectNameSingular: objectMetadataItem.nameSingular,
  });

  const fieldsById = new Map(
    objectMetadataItem.fields
      .filter((field) => field.isActive)
      .map((field) => [field.id, field]),
  );

  const propertyGroupSections: RoboostPropertySection[] = (
    propertySettings?.groups ?? []
  )
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
    .filter((section) => section.fields.length > 0);

  const shownFieldIds = new Set(
    propertyGroupSections.flatMap((section) =>
      section.fields.map((field) => field.id),
    ),
  );

  const widgetSections: RoboostPropertySection[] = fieldsWidgetGroups
    .filter((group) => group.isVisible)
    .map((group) => ({
      id: group.id,
      title: group.name,
      fields: group.fields
        .filter(
          (groupField) =>
            groupField.isVisible &&
            !shownFieldIds.has(groupField.fieldMetadataItem.id) &&
            !HEADER_FIELD_NAMES.has(groupField.fieldMetadataItem.name),
        )
        .map((groupField) => groupField.fieldMetadataItem),
    }))
    .filter((section) => section.fields.length > 0);

  return [...propertyGroupSections, ...widgetSections];
};
