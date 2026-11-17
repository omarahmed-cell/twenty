import {
  type FieldsWidgetGroup,
  type FieldsWidgetGroupField,
} from '@/page-layout/widgets/fields/types/FieldsWidgetGroup';

// The hover and edit portals look fields up by global index, so the remaining fields are renumbered
export const hideFieldsWidgetFields = ({
  groups,
  hiddenFields,
  hiddenFieldNames,
}: {
  groups: FieldsWidgetGroup[];
  hiddenFields: FieldsWidgetGroupField[];
  hiddenFieldNames: ReadonlySet<string>;
}) => {
  if (hiddenFieldNames.size === 0) {
    return { groups, hiddenFields };
  }

  let globalIndex = 0;

  const keep = (fields: FieldsWidgetGroupField[]) =>
    fields
      .filter(
        ({ fieldMetadataItem }) =>
          !hiddenFieldNames.has(fieldMetadataItem.name),
      )
      .map((field) => ({ ...field, globalIndex: globalIndex++ }));

  const visibleGroups = groups
    .map((group) => ({ ...group, fields: keep(group.fields) }))
    .filter((group) => group.fields.length > 0);

  return {
    groups: visibleGroups,
    hiddenFields: keep(hiddenFields).map((field) => ({
      ...field,
      globalIndex:
        field.globalIndex -
        visibleGroups.flatMap(({ fields }) => fields).length,
    })),
  };
};
