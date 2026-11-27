import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { getRoboostFieldEditKind } from '@/roboost-app/fields/getRoboostFieldEditKind';
import {
  getRoboostCellEditorKey,
  RoboostListEditableCell,
} from '@/roboost-app/list/components/RoboostListEditableCell';
import { useRoboostCellEditor } from '@/roboost-app/list/hooks/useRoboostCellEditor';
import { useRoboostAccess } from '@/roboost-app/users-and-teams/hooks/useRoboostAccess';
import { cx } from '@/roboost-ui/utils/cx';

type RoboostHeaderPropertyLineProps = {
  field: FieldMetadataItem;
  record: Record<string, unknown> & { id: string };
  objectMetadataItem: EnrichedObjectMetadataItem;
  objectMetadataItems: EnrichedObjectMetadataItem[];
  onSaved: () => void;
};

// "Label: value" under the record name; the value edits in place like a property row
export const RoboostHeaderPropertyLine = ({
  field,
  record,
  objectMetadataItem,
  objectMetadataItems,
  onSaved,
}: RoboostHeaderPropertyLineProps) => {
  const editor = useRoboostCellEditor(
    `header:${getRoboostCellEditorKey(record.id, field.id)}`,
  );
  const { isAdmin } = useRoboostAccess();
  const isEditable = getRoboostFieldEditKind(field, { isAdmin }) !== null;

  return (
    <div
      className={cx(
        'rb-prop rb-tb-prop',
        isEditable && 'is-editable',
        editor.isEditing && 'is-editing',
      )}
      onClick={() => {
        if (isEditable && !editor.isEditing) {
          editor.open();
        }
      }}
    >
      <span className="rb-tb-prop-label">{field.label}:</span>
      <div className="rb-tb-prop-value">
        <RoboostListEditableCell
          field={field}
          record={record}
          objectMetadataItem={objectMetadataItem}
          objectMetadataItems={objectMetadataItems}
          onSaved={onSaved}
          editorKey={`header:${getRoboostCellEditorKey(record.id, field.id)}`}
          hideEditButton
          selectAsTag
        />
      </div>
    </div>
  );
};
