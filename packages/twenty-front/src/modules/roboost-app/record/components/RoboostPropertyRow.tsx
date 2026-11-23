import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { getRoboostFieldEditKind } from '@/roboost-app/fields/getRoboostFieldEditKind';
import { roboostFieldHistoryState } from '@/roboost-app/history/states/roboostFieldHistoryState';
import {
  getRoboostCellEditorKey,
  RoboostListEditableCell,
} from '@/roboost-app/list/components/RoboostListEditableCell';
import { useRoboostCellEditor } from '@/roboost-app/list/hooks/useRoboostCellEditor';
import { Icon } from '@/roboost-ui/components/Icon';
import { cx } from '@/roboost-ui/utils/cx';
import { useSetAtomState } from '@/ui/utilities/state/jotai/hooks/useSetAtomState';
import { useLingui } from '@lingui/react/macro';
import { type MouseEvent, useRef } from 'react';
import { useCopyToClipboard } from '~/hooks/useCopyToClipboard';

const EMPTY_DISPLAY = '—';

type RoboostPropertyRowProps = {
  field: FieldMetadataItem;
  record: Record<string, unknown> & { id: string };
  objectMetadataItem: EnrichedObjectMetadataItem;
  objectMetadataItems: EnrichedObjectMetadataItem[];
  onSaved: () => void;
};

// Label above value; the whole row opens the editor, history and copy sit on the label line
export const RoboostPropertyRow = ({
  field,
  record,
  objectMetadataItem,
  objectMetadataItems,
  onSaved,
}: RoboostPropertyRowProps) => {
  const { t } = useLingui();
  const editor = useRoboostCellEditor(
    getRoboostCellEditorKey(record.id, field.id),
  );
  const isEditing = editor.isEditing;
  const valueRef = useRef<HTMLDivElement>(null);
  const setRoboostFieldHistory = useSetAtomState(roboostFieldHistoryState);
  const { copyToClipboard } = useCopyToClipboard();
  const isEditable = getRoboostFieldEditKind(field) !== null;

  const stopRowClick = (event: MouseEvent) => event.stopPropagation();

  const copyValue = () => {
    const shownValue = valueRef.current?.innerText.trim() ?? '';

    copyToClipboard(shownValue === EMPTY_DISPLAY ? '' : shownValue, t`Copied`);
  };

  return (
    <div
      className={cx(
        'rb-prop',
        isEditable && 'is-editable',
        isEditing && 'is-editing',
      )}
      onClick={() => {
        if (isEditable && !isEditing) {
          editor.open();
        }
      }}
    >
      <div className="rb-prop-head">
        <div className="rb-prop-label" title={field.label}>
          {field.label}
        </div>
        <div className="rb-prop-tools" onClick={stopRowClick}>
          <button
            type="button"
            className="rb-prop-tool"
            aria-label={t`${field.label} history`}
            title={t`Property history`}
            onClick={() =>
              setRoboostFieldHistory({
                objectNameSingular: objectMetadataItem.nameSingular,
                recordId: record.id,
                fieldName: field.name,
              })
            }
          >
            <Icon name="history" size={14} />
          </button>
          <button
            type="button"
            className="rb-prop-tool"
            aria-label={t`Copy ${field.label}`}
            title={t`Copy value`}
            onClick={copyValue}
          >
            <Icon name="copy" size={14} />
          </button>
        </div>
      </div>
      <div className="rb-prop-value" ref={valueRef}>
        <RoboostListEditableCell
          field={field}
          record={record}
          objectMetadataItem={objectMetadataItem}
          objectMetadataItems={objectMetadataItems}
          onSaved={onSaved}
          hideEditButton
        />
        {isEditable && !isEditing && (
          <Icon name="caret" size={14} className="rb-prop-caret" />
        )}
      </div>
    </div>
  );
};
