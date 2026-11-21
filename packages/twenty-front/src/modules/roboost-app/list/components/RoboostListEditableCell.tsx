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

type RoboostListEditableCellProps = {
  field: FieldMetadataItem;
  record: Record<string, unknown> & { id: string };
  objectMetadataItem: EnrichedObjectMetadataItem;
  objectMetadataItems: EnrichedObjectMetadataItem[];
  onSaved: () => void;
};

export const RoboostListEditableCell = ({
  field,
  record,
  objectMetadataItem,
  objectMetadataItems,
  onSaved,
}: RoboostListEditableCellProps) => {
  const { t } = useLingui();
  const { updateOneRecord } = useUpdateOneRecord();
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<unknown>(undefined);
  const [draftRelated, setDraftRelated] = useState<
    Record<string, unknown> | null | undefined
  >(undefined);
  const [error, setError] = useState<string | null>(null);
  const isEditable = getRoboostFieldEditKind(field) !== null;

  const startEditing = () => {
    setDraft(
      field.relation !== undefined && field.relation !== null
        ? ((record[field.name] as { id?: string } | null)?.id ?? null)
        : record[field.name],
    );
    setDraftRelated(undefined);
    setError(null);
    setIsEditing(true);
  };

  const save = async () => {
    try {
      await updateOneRecord({
        objectNameSingular: objectMetadataItem.nameSingular,
        idToUpdate: record.id,
        updateOneRecordInput: { [getRoboostFieldInputKey(field)]: draft },
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
        {isEditable && (
          <button
            type="button"
            className="rb-cell-edit"
            aria-label={t`Edit ${field.label}`}
            onClick={(event) => {
              event.stopPropagation();
              startEditing();
            }}
          >
            <Icon name="pencil" size={13} />
          </button>
        )}
      </div>
    );
  }

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
          event.relatedTarget !== null &&
          !event.currentTarget.contains(event.relatedTarget)
        ) {
          save();
        }
      }}
    >
      <RoboostFieldInput
        field={field}
        value={draft}
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
        }}
      />
      {error !== null && <div className="rb-field-error">{error}</div>}
      <div className="rb-cell-editor-actions">
        <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
          {t`Cancel`}
        </Button>
        <Button size="sm" variant="primary" onClick={save}>
          {t`Save`}
        </Button>
      </div>
    </div>
  );
};
