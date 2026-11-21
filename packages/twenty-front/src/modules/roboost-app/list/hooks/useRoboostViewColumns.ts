import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { getRoboostLabelIdentifierFieldName } from '@/roboost-app/fields/getRoboostRecordLabel';
import { usePerformViewFieldApiPersist } from '@/views/hooks/internal/usePerformViewFieldApiPersist';
import { type View } from '@/views/types/View';
import { useState } from 'react';
import { isDefined } from 'twenty-shared/utils';
import { FieldMetadataType } from '~/generated-metadata/graphql';

export type RoboostListColumn = {
  field: FieldMetadataItem;
  viewFieldId?: string;
  size: number;
};

const HIDDEN_FIELD_TYPES = new Set<string>([
  FieldMetadataType.TS_VECTOR,
  FieldMetadataType.POSITION,
  FieldMetadataType.MORPH_RELATION,
  FieldMetadataType.RAW_JSON,
]);

const DEFAULT_COLUMN_SIZE = 180;
const FALLBACK_COLUMN_COUNT = 6;

export const isRoboostListableField = (field: FieldMetadataItem) =>
  field.isActive &&
  field.isSystem !== true &&
  !HIDDEN_FIELD_TYPES.has(field.type) &&
  field.name !== 'id' &&
  field.name !== 'deletedAt';

// Columns, order and visibility live in the view's own fields, so the classic table shows the same set
export const useRoboostViewColumns = ({
  view,
  objectMetadataItem,
}: {
  view: View | undefined;
  objectMetadataItem: EnrichedObjectMetadataItem;
}) => {
  const { performViewFieldApiCreate, performViewFieldApiUpdate } =
    usePerformViewFieldApiPersist();
  const [isSaving, setIsSaving] = useState(false);

  const fieldsById = new Map(
    objectMetadataItem.fields.map((field) => [field.id, field]),
  );
  const labelFieldName = getRoboostLabelIdentifierFieldName(objectMetadataItem);
  const labelField = objectMetadataItem.fields.find(
    (field) => field.name === labelFieldName,
  );

  const viewColumns: RoboostListColumn[] = (view?.viewFields ?? [])
    .filter((viewField) => viewField.isVisible && viewField.isActive !== false)
    .sort((first, second) => first.position - second.position)
    .map((viewField) => {
      const field = fieldsById.get(viewField.fieldMetadataId);

      return isDefined(field) && isRoboostListableField(field)
        ? { field, viewFieldId: viewField.id, size: viewField.size }
        : undefined;
    })
    .filter(isDefined);

  const fallbackColumns: RoboostListColumn[] = objectMetadataItem.fields
    .filter(isRoboostListableField)
    .slice(0, FALLBACK_COLUMN_COUNT)
    .map((field) => ({ field, size: DEFAULT_COLUMN_SIZE }));

  const unorderedColumns =
    viewColumns.length > 0 ? viewColumns : fallbackColumns;

  // The record name always leads, as in the design
  const columns = isDefined(labelField)
    ? [
        unorderedColumns.find(
          (column) => column.field.id === labelField.id,
        ) ?? {
          field: labelField,
          size: DEFAULT_COLUMN_SIZE,
        },
        ...unorderedColumns.filter(
          (column) => column.field.id !== labelField.id,
        ),
      ]
    : unorderedColumns;

  const applyColumns = async (orderedFieldIds: string[]) => {
    if (!isDefined(view)) {
      return;
    }
    setIsSaving(true);

    try {
      const viewFieldByFieldId = new Map(
        view.viewFields.map((viewField) => [
          viewField.fieldMetadataId,
          viewField,
        ]),
      );
      const updates = view.viewFields
        .map((viewField) => {
          const nextPosition = orderedFieldIds.indexOf(
            viewField.fieldMetadataId,
          );
          const isVisible = nextPosition !== -1;

          if (
            viewField.isVisible === isVisible &&
            (!isVisible || viewField.position === nextPosition)
          ) {
            return undefined;
          }

          return {
            input: {
              id: viewField.id,
              update: isVisible
                ? { isVisible: true, position: nextPosition }
                : { isVisible: false },
            },
          };
        })
        .filter(isDefined);

      const creations = orderedFieldIds
        .map((fieldId, position) =>
          viewFieldByFieldId.has(fieldId)
            ? undefined
            : {
                fieldMetadataId: fieldId,
                viewId: view.id,
                isVisible: true,
                position,
                size: DEFAULT_COLUMN_SIZE,
              },
        )
        .filter(isDefined);

      if (updates.length > 0) {
        await performViewFieldApiUpdate(updates);
      }
      if (creations.length > 0) {
        await performViewFieldApiCreate({ inputs: creations });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const columnFieldIds = columns.map((column) => column.field.id);

  return {
    columns,
    isSaving,
    applyColumns,
    addColumn: (fieldId: string) => applyColumns([...columnFieldIds, fieldId]),
    removeColumn: (fieldId: string) =>
      applyColumns(columnFieldIds.filter((id) => id !== fieldId)),
    moveColumn: (fromIndex: number, toIndex: number) => {
      const next = [...columnFieldIds];
      const [moved] = next.splice(fromIndex, 1);

      next.splice(toIndex, 0, moved);

      return applyColumns(next);
    },
  };
};
