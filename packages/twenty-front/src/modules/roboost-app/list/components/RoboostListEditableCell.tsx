import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { useUpdateOneRecord } from '@/object-record/hooks/useUpdateOneRecord';
import { getRoboostFieldEditKind } from '@/roboost-app/fields/getRoboostFieldEditKind';
import { getRoboostFieldInputKey } from '@/roboost-app/fields/getRoboostFieldInputKey';
import { useRoboostRequiredFieldsCheck } from '@/roboost-app/fields/hooks/useRoboostRequiredFieldsCheck';
import { RoboostFieldInput } from '@/roboost-app/fields/RoboostFieldInput';
import { RoboostListCellValue } from '@/roboost-app/list/components/RoboostListCellValue';
import { useRoboostCellEditor } from '@/roboost-app/list/hooks/useRoboostCellEditor';
import { Button } from '@/roboost-ui/components/Button';
import { Icon } from '@/roboost-ui/components/Icon';
import { cx } from '@/roboost-ui/utils/cx';
import { useLingui } from '@lingui/react/macro';
import { memo, useEffect, useRef, useState } from 'react';

const NOT_EDITED = Symbol('notEdited');

// Picking from a list is the whole edit, so these save on choice instead of waiting for Save
const SAVE_ON_CHOICE_KINDS = new Set([
  'select',
  'multiSelect',
  'rating',
  'relation',
]);

// Clicks inside these belong to the open editor (portalled dropdowns, dialogs it opens)
const EDITOR_OVERLAY_SELECTOR =
  '.rb-menu-portal, .rb-popover-panel, .rb-modal-scrim, [role="dialog"]';

type RoboostListEditableCellProps = {
  field: FieldMetadataItem;
  record: Record<string, unknown> & { id: string };
  objectMetadataItem: EnrichedObjectMetadataItem;
  objectMetadataItems: EnrichedObjectMetadataItem[];
  onSaved?: () => void;
  hideEditButton?: boolean;
};

export const getRoboostCellEditorKey = (recordId: string, fieldId: string) =>
  `${recordId}:${fieldId}`;

const RoboostListCellEditor = ({
  field,
  record,
  objectMetadataItem,
  onSaved,
  editor,
}: RoboostListCellEditorProps) => {
  const { t } = useLingui();
  const { updateOneRecord } = useUpdateOneRecord();
  const { completeChange } = useRoboostRequiredFieldsCheck(objectMetadataItem);
  const editorRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState<unknown>(NOT_EDITED);
  const [draftRelated, setDraftRelated] = useState<
    Record<string, unknown> | null | undefined
  >(undefined);
  const [error, setError] = useState<string | null>(null);
  const editKind = getRoboostFieldEditKind(field);
  const isEditing = editor.isEditing;
  const saveOnChoice = editKind !== null && SAVE_ON_CHOICE_KINDS.has(editKind);

  const initialValue =
    field.relation !== undefined && field.relation !== null
      ? ((record[field.name] as { id?: string } | null)?.id ?? null)
      : record[field.name];
  const currentDraft = draft === NOT_EDITED ? initialValue : draft;

  const resetDraft = () => {
    setDraft(NOT_EDITED);
    setDraftRelated(undefined);
    setError(null);
  };

  const cancel = () => {
    resetDraft();
    editor.close();
  };

  const save = async (value: unknown = currentDraft) => {
    try {
      const input = await completeChange({
        recordId: record.id,
        record,
        changes: { [getRoboostFieldInputKey(field)]: value },
      });

      if (input === null) {
        cancel();
        return;
      }
      await updateOneRecord({
        objectNameSingular: objectMetadataItem.nameSingular,
        idToUpdate: record.id,
        updateOneRecordInput: input,
      });
      cancel();
      onSaved?.();
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : t`Could not save`,
      );
    }
  };

  // Click outside: an untouched editor closes, a changed one stays with its Save / Cancel
  useEffect(() => {
    if (!isEditing) {
      return;
    }
    const closeWhenUntouched = (event: PointerEvent) => {
      const target = event.target;

      if (
        !(target instanceof Element) ||
        editorRef.current?.contains(target) === true ||
        target.closest(EDITOR_OVERLAY_SELECTOR) !== null
      ) {
        return;
      }
      editor.closeIfUntouched();
    };

    const cancelOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !event.defaultPrevented) {
        resetDraft();
        editor.close();
      }
    };

    document.addEventListener('pointerdown', closeWhenUntouched, true);
    document.addEventListener('keydown', cancelOnEscape);

    return () => {
      document.removeEventListener('pointerdown', closeWhenUntouched, true);
      document.removeEventListener('keydown', cancelOnEscape);
    };
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing]);

  return (
    <div
      ref={editorRef}
      className={cx(
        'rb-cell-editor',
        editor.needsAttention && 'needs-attention',
      )}
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.stopPropagation();
          cancel();
        }
        if (
          event.key === 'Enter' &&
          !saveOnChoice &&
          !(event.target instanceof HTMLTextAreaElement)
        ) {
          event.preventDefault();
          save();
        }
      }}
    >
      <RoboostFieldInput
        field={field}
        value={currentDraft}
        autoOpen
        onCancel={cancel}
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
            return;
          }
          editor.setIsDirty(
            JSON.stringify(value ?? null) !==
              JSON.stringify(initialValue ?? null),
          );
        }}
      />
      {error !== null && <div className="rb-field-error">{error}</div>}
      {!saveOnChoice && (
        <div className="rb-cell-editor-actions">
          <Button size="sm" variant="ghost" onClick={cancel}>
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

type RoboostListCellEditorProps = Omit<
  RoboostListEditableCellProps,
  'hideEditButton' | 'objectMetadataItems'
> & {
  editor: ReturnType<typeof useRoboostCellEditor>;
};

// Display cells stay cheap: the save hooks mount only in the one open editor
export const RoboostListEditableCell = memo(
  ({
    field,
    record,
    objectMetadataItem,
    objectMetadataItems,
    onSaved,
    hideEditButton = false,
  }: RoboostListEditableCellProps) => {
    const { t } = useLingui();
    const editor = useRoboostCellEditor(
      getRoboostCellEditorKey(record.id, field.id),
    );
    const isEditable = getRoboostFieldEditKind(field) !== null;

    // A row that leaves the screen must not keep the shared editor slot
    useEffect(
      () => () => editor.close(),
      // oxlint-disable-next-line react-hooks/exhaustive-deps
      [],
    );

    if (editor.isEditing) {
      return (
        <RoboostListCellEditor
          field={field}
          record={record}
          objectMetadataItem={objectMetadataItem}
            onSaved={onSaved}
          editor={editor}
        />
      );
    }

    return (
      <div
        className={cx('rb-cell', isEditable && 'is-editable')}
        onPointerDown={(event) => {
          if (
            event.button !== 0 ||
            !isEditable ||
            (event.target instanceof Element &&
              event.target.closest('a') !== null)
          ) {
            return;
          }
          event.stopPropagation();
          editor.open();
        }}
      >
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
              editor.open();
            }}
          >
            <Icon name="pencil" size={13} />
          </button>
        )}
      </div>
    );
  },
);
