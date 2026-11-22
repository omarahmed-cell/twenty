import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { ROBOOST_BOARD_CARD_FIELD_LIMIT } from '@/roboost-app/board/hooks/useRoboostBoardCardFields';
import { Button } from '@/roboost-ui/components/Button';
import { Icon } from '@/roboost-ui/components/Icon';
import { Menu } from '@/roboost-ui/components/Menu';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { isDefined } from 'twenty-shared/utils';

type RoboostCardSettingsPanelProps = {
  objectMetadataItem: EnrichedObjectMetadataItem;
  cardFields: FieldMetadataItem[];
  listableFields: FieldMetadataItem[];
  onSave: (fieldNames: string[]) => void;
  onClose: () => void;
};

export const RoboostCardSettingsPanel = ({
  objectMetadataItem,
  cardFields,
  listableFields,
  onSave,
  onClose,
}: RoboostCardSettingsPanelProps) => {
  const { t } = useLingui();
  const [names, setNames] = useState(cardFields.map((field) => field.name));
  const [draggedName, setDraggedName] = useState<string | null>(null);
  const selectedFields = names
    .map((name) => listableFields.find((field) => field.name === name))
    .filter(isDefined);
  const objectLabel = objectMetadataItem.labelSingular.toLowerCase();

  const moveTo = (targetName: string) => {
    if (!isDefined(draggedName) || draggedName === targetName) {
      return;
    }
    const next = names.filter((name) => name !== draggedName);
    const targetIndex = next.indexOf(targetName);

    next.splice(
      names.indexOf(draggedName) < names.indexOf(targetName)
        ? targetIndex + 1
        : targetIndex,
      0,
      draggedName,
    );
    setNames(next);
  };

  return createPortal(
    <div className="rb-ui rb-cpanel-layer">
      <div className="rb-cscrim" onClick={onClose} />
      <aside className="rb-cpanel" aria-label={t`Card settings`}>
        <div className="rb-cpanel-head">
          <div>
            <div className="rb-cm-title">{t`Card settings`}</div>
            <div className="rb-cm-sub">
              {t`Choose which properties show on each ${objectLabel} card. Drag to reorder.`}
            </div>
          </div>
          <button
            type="button"
            className="rb-rc-iconbtn"
            aria-label={t`Close`}
            onClick={onClose}
          >
            <Icon name="x" size={16} />
          </button>
        </div>
        <div className="rb-cpanel-body rb-cardset-body">
          <div className="rb-cm-group">{t`Preview`}</div>
          <div className="rb-cardset-preview">
            <div className="rb-bcard">
              <span className="rb-bcard-name">{t`Example ${objectLabel}`}</span>
              <div className="rb-bcard-props">
                {selectedFields.map((field) => (
                  <div key={field.id} className="rb-bcard-prop">
                    <span className="rb-bcard-key">{field.label}: </span>
                    <b>…</b>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="rb-cm-group">
            {t`Shown on card (${selectedFields.length} of ${ROBOOST_BOARD_CARD_FIELD_LIMIT})`}
          </div>
          {selectedFields.map((field) => (
            <div
              key={field.id}
              className="rb-cm-selitem"
              draggable
              onDragStart={() => setDraggedName(field.name)}
              onDragOver={(event) => {
                event.preventDefault();
                moveTo(field.name);
              }}
              onDragEnd={() => setDraggedName(null)}
            >
              <span className="rb-cmdrag">
                <Icon name="grip" size={14} />
              </span>
              <span className="rb-cm-selname">{field.label}</span>
              <button
                type="button"
                className="rb-cm-selx"
                aria-label={t`Remove ${field.label}`}
                onClick={() =>
                  setNames(names.filter((name) => name !== field.name))
                }
              >
                <Icon name="x" size={14} />
              </button>
            </div>
          ))}
          {selectedFields.length < ROBOOST_BOARD_CARD_FIELD_LIMIT && (
            <Menu
              minWidth={260}
              entries={listableFields
                .filter((field) => !names.includes(field.name))
                .sort((first, second) =>
                  first.label.localeCompare(second.label),
                )
                .map((field) => ({
                  id: field.name,
                  label: field.label,
                  onSelect: () => setNames([...names, field.name]),
                }))}
              trigger={({ toggle, isOpen }) => (
                <button
                  type="button"
                  className="rb-addcol-btn"
                  aria-expanded={isOpen}
                  onClick={toggle}
                >
                  <Icon name="plus" size={13} strokeWidth={2} />
                  {t`Add property`}
                </button>
              )}
            />
          )}
        </div>
        <div className="rb-cpanel-foot">
          <Button
            variant="primary"
            onClick={() => {
              onSave(names);
              onClose();
            }}
          >
            {t`Save`}
          </Button>
          <Button variant="ghost" onClick={onClose}>
            {t`Cancel`}
          </Button>
        </div>
      </aside>
    </div>,
    document.body,
  );
};
