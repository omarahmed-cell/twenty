import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { useUpdateOneRecord } from '@/object-record/hooks/useUpdateOneRecord';
import { getRoboostFieldEditKind } from '@/roboost-app/fields/getRoboostFieldEditKind';
import { getRoboostFieldInputKey } from '@/roboost-app/fields/getRoboostFieldInputKey';
import { RoboostFieldInput } from '@/roboost-app/fields/RoboostFieldInput';
import { RoboostListCellValue } from '@/roboost-app/list/components/RoboostListCellValue';
import { Button } from '@/roboost-ui/components/Button';
import { Icon } from '@/roboost-ui/components/Icon';
import { useLingui } from '@lingui/react/macro';
import { type FocusEvent, useState } from 'react';

const NOT_EDITED = Symbol('notEdited');

// Picking from a list is the whole edit, so these save on choice instead of waiting for Save
const SAVE_ON_CHOICE_KINDS = new Set([
  'select',
  'multiSelect',
  'rating',
  'relation',
]);

type RoboostListEditableCellProps = {
  field: FieldMetadataItem;
  record: Record<string, unknown> & { id: string };
  objectMetadataItem: EnrichedObjectMetadataItem;
  objectMetadataItems: EnrichedObjectMetadataItem[];
  onSaved: () => void;
  isEditing?: boolean;
  onIsEditingChange?: (isEditing: boolean) => void;
  hideEditButton?: boolean;
};

export const RoboostListEditableCell = ({
  field,
  record,
  objectMetadataItem,
  objectMetadataItems,
  onSaved,
  isEditing: controlledIsEditing,
  onIsEditingChange,
  hideEditButton = false,
}: RoboostListEditableCellProps) => {
  const { t } = useLingui();
  const { updateOneRecord } = useUpdateOneRecord();
  const [uncontrolledIsEditing, setUncontrolledIsEditing] = useState(false);
  const [draft, setDraft] = useState<unknown>(NOT_EDITED);
  const [draftRelated, setDraftRelated] = useState<
    Record<string, unknown> | null | undefined
  >(undefined);
  const [error, setError] = useState<string | null>(null);
  const editKind = getRoboostFieldEditKind(field);
  const isEditable = editKind !== null;
  const isEditing = controlledIsEditing ?? uncontrolledIsEditing;

  const initialValue =
    field.relation !== undefined && field.relation !== null
      ? ((record[field.name] as { id?: string } | null)?.id ?? null)
      : record[field.name];
  const currentDraft = draft === NOT_EDITED ? initialValue : draft;

  const setIsEditing = (nextIsEditing: boolean) => {
    if (!nextIsEditing) {
      setDraft(NOT_EDITED);
      setDraftRelated(undefined);
    }
    setError(null);
    setUncontrolledIsEditing(nextIsEditing);
    onIsEditingChange?.(nextIsEditing);
  };

  const save = async (value: unknown = currentDraft) => {
    try {
      await updateOneRecord({
        objectNameSingular: objectMetadataItem.nameSingular,
        idToUpdate: record.id,
        updateOneRecordInput: { [getRoboostFieldInputKey(field)]: value },
      });
      setIsEditing(false);
      onSaved();
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : t`Could not save`,
      );
    }
  };

  if (!isEditing) {
    return (
      <div className="rb-cell">
        <RoboostListCellValue
          field={field}
          record={record}
          objectMetadataItems={objectMetadataItems}
        />
        {isEditable && !hideEditButton && (
          <button
            type="button"
            className="rb-cell-edit"
            aria-label={t`Edit ${field.label}`}
            onClick={(event) => {
              event.stopPropagation();
              setIsEditing(true);
            }}
          >
            <Icon name="pencil" size={13} />
          </button>
        )}
      </div>
    );
  }

  const saveOnChoice = editKind !== null && SAVE_ON_CHOICE_KINDS.has(editKind);

  return (
    <div
      className="rb-cell-editor"
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          setIsEditing(false);
        }
        if (
          event.key === 'Enter' &&
          !(event.target instanceof HTMLTextAreaElement)
        ) {
          event.preventDefault();
          save();
        }
      }}
      onBlur={(event: FocusEvent<HTMLDivElement>) => {
        if (
          event.relatedTarget === null ||
          event.currentTarget.contains(event.relatedTarget) ||
          event.relatedTarget.closest('.rb-menu-portal') !== null
        ) {
          return;
        }
        if (saveOnChoice) {
          setIsEditing(false);
        } else {
          save();
        }
      }}
    >
      <RoboostFieldInput
        field={field}
        value={currentDraft}
        autoOpen
        onCancel={() => setIsEditing(false)}
        relatedRecord={
          draftRelated !== undefined
            ? draftRelated
            : (record[field.name] as Record<string, unknown> | null)
        }
        onChange={(value, related) => {
          setDraft(value);
          if (related !== undefined) {
            setDraftRelated(
              related === null ? null : { id: related.id, name: related.label },
            );
          }
          if (saveOnChoice) {
            save(value);
          }
        }}
      />
      {error !== null && <div className="rb-field-error">{error}</div>}
      {!saveOnChoice && (
        <div className="rb-cell-editor-actions">
          <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
            {t`Cancel`}
          </Button>
          <Button size="sm" variant="primary" onClick={() => save()}>
            {t`Save`}
          </Button>
        </div>
      )}
    </div>
  );
};
