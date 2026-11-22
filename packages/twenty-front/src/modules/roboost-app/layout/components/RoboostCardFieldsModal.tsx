import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { moveRoboostLayoutItem } from '@/roboost-app/layout/utils/moveRoboostLayoutItem';
import { Button } from '@/roboost-ui/components/Button';
import { Icon } from '@/roboost-ui/components/Icon';
import { Input } from '@/roboost-ui/components/Input';
import { Modal } from '@/roboost-ui/components/Modal';
import { cx } from '@/roboost-ui/utils/cx';
import { useLingui } from '@lingui/react/macro';
import { isNonEmptyString } from '@sniptt/guards';
import { useState } from 'react';
import { isDefined } from 'twenty-shared/utils';

type RoboostCardFieldsModalProps = {
  heading: string;
  submitLabel: string;
  // Undefined hides the name input (association cards keep their relation's name)
  initialName?: string;
  // Undefined hides the property picker (Overview sections only have a name)
  fields?: FieldMetadataItem[];
  initialFieldNames?: string[];
  fieldsHint?: string;
  onApply: (result: { name: string; fieldNames: string[] }) => void;
  onClose: () => void;
};

export const RoboostCardFieldsModal = ({
  heading,
  submitLabel,
  initialName,
  fields,
  initialFieldNames = [],
  fieldsHint,
  onApply,
  onClose,
}: RoboostCardFieldsModalProps) => {
  const { t } = useLingui();
  const [name, setName] = useState(initialName ?? '');
  const [fieldNames, setFieldNames] = useState<string[]>(initialFieldNames);
  const [search, setSearch] = useState('');
  const [draggedName, setDraggedName] = useState<string | null>(null);

  const hasName = isDefined(initialName);
  const findField = (fieldName: string) =>
    fields?.find((field) => field.name === fieldName);
  const selectedFields = fieldNames.map(findField).filter(isDefined);
  const normalizedSearch = search.trim().toLowerCase();
  const availableFields = (fields ?? [])
    .filter(
      (field) =>
        !fieldNames.includes(field.name) &&
        field.label.toLowerCase().includes(normalizedSearch),
    )
    .sort((first, second) => first.label.localeCompare(second.label));
  const canSubmit = !hasName || isNonEmptyString(name.trim());

  return (
    <Modal
      title={heading}
      width={isDefined(fields) ? 720 : 440}
      onClose={onClose}
      className="rb-rve-modal"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t`Cancel`}
          </Button>
          <Button
            variant="primary"
            disabled={!canSubmit}
            onClick={() => onApply({ name: name.trim(), fieldNames })}
          >
            {submitLabel}
          </Button>
        </>
      }
    >
      {hasName && (
        <label className="rb-rve-modal-name">
          <span className="rb-act-label">{t`Card name`}</span>
          <Input
            value={name}
            placeholder={t`e.g. Sales information`}
            aria-label={t`Card name`}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
      )}
      {isDefined(fields) && (
        <div className="rb-rve-picker">
          <div className="rb-rve-picker-col">
            <div className="rb-act-label">{t`Add properties`}</div>
            <Input
              variant="search"
              size="sm"
              value={search}
              placeholder={t`Search properties`}
              aria-label={t`Search properties`}
              onChange={(event) => setSearch(event.target.value)}
            />
            <div className="rb-rve-picker-list">
              {availableFields.map((field) => (
                <button
                  key={field.id}
                  type="button"
                  className="rb-rve-picker-item"
                  onClick={() => setFieldNames([...fieldNames, field.name])}
                >
                  <Icon name="plus" size={13} />
                  <span>{field.label}</span>
                </button>
              ))}
              {availableFields.length === 0 && (
                <div className="rb-forms-hint">{t`No more properties.`}</div>
              )}
            </div>
          </div>
          <div className="rb-rve-picker-col">
            <div className="rb-act-label">
              {t`Properties on this card (${selectedFields.length})`}
            </div>
            {isDefined(fieldsHint) && (
              <div className="rb-forms-hint">{fieldsHint}</div>
            )}
            <div className="rb-rve-picker-list">
              {selectedFields.map((field) => (
                <div
                  key={field.name}
                  className={cx(
                    'rb-rve-picked',
                    draggedName === field.name && 'is-dragging',
                  )}
                  draggable
                  onDragStart={() => setDraggedName(field.name)}
                  onDragOver={(event) => {
                    event.preventDefault();
                    if (isDefined(draggedName) && draggedName !== field.name) {
                      setFieldNames(
                        moveRoboostLayoutItem(
                          fieldNames,
                          (fieldName) => fieldName,
                          draggedName,
                          field.name,
                        ),
                      );
                    }
                  }}
                  onDragEnd={() => setDraggedName(null)}
                >
                  <span className="rb-rve-grip" aria-hidden>
                    <Icon name="grip" size={13} />
                  </span>
                  <span className="rb-rve-picked-name">{field.label}</span>
                  <button
                    type="button"
                    className="rb-rc-iconbtn"
                    aria-label={t`Remove ${field.label}`}
                    onClick={() =>
                      setFieldNames(
                        fieldNames.filter(
                          (fieldName) => fieldName !== field.name,
                        ),
                      )
                    }
                  >
                    <Icon name="x" size={14} />
                  </button>
                </div>
              ))}
              {selectedFields.length === 0 && (
                <div className="rb-forms-hint">
                  {t`Pick properties on the left. Drag to order them.`}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};
