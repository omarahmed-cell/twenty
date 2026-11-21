import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { getRoboostLabelIdentifierFieldName } from '@/roboost-app/fields/getRoboostRecordLabel';
import { useRoboostFieldGroups } from '@/roboost-app/list/hooks/useRoboostFieldGroups';
import { Button } from '@/roboost-ui/components/Button';
import { Checkbox } from '@/roboost-ui/components/Checkbox';
import { Icon } from '@/roboost-ui/components/Icon';
import { Input } from '@/roboost-ui/components/Input';
import { Menu } from '@/roboost-ui/components/Menu';
import { cx } from '@/roboost-ui/utils/cx';
import { useLingui } from '@lingui/react/macro';
import { Fragment, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { isDefined } from 'twenty-shared/utils';

type RoboostColumnsModalProps = {
  objectMetadataItem: EnrichedObjectMetadataItem;
  selectedFieldIds: string[];
  frozenCount: number;
  onApply: (fieldIds: string[], frozenCount: number) => void;
  onClose: () => void;
};

const MAX_FROZEN_COLUMNS = 3;

export const RoboostColumnsModal = ({
  objectMetadataItem,
  selectedFieldIds,
  frozenCount,
  onApply,
  onClose,
}: RoboostColumnsModalProps) => {
  const { t } = useLingui();
  const groups = useRoboostFieldGroups(objectMetadataItem);
  const [draftIds, setDraftIds] = useState(selectedFieldIds);
  const [draftFrozen, setDraftFrozen] = useState(frozenCount);
  const [search, setSearch] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const term = search.trim().toLowerCase();
  const labelFieldName = getRoboostLabelIdentifierFieldName(objectMetadataItem);
  const labelFieldId = objectMetadataItem.fields.find(
    (field) => field.name === labelFieldName,
  )?.id;
  const fieldsById = new Map(
    objectMetadataItem.fields.map((field) => [field.id, field]),
  );

  const toggle = (fieldId: string) => {
    if (fieldId === labelFieldId) {
      return;
    }
    setDraftIds(
      draftIds.includes(fieldId)
        ? draftIds.filter((id) => id !== fieldId)
        : [...draftIds, fieldId],
    );
  };

  const move = (fromIndex: number, toIndex: number) => {
    if (fromIndex === 0 || toIndex === 0) {
      return;
    }
    const next = [...draftIds];
    const [moved] = next.splice(fromIndex, 1);

    next.splice(toIndex, 0, moved);
    setDraftIds(next);
  };

  const keepOnlyName = () =>
    setDraftIds(isDefined(labelFieldId) ? [labelFieldId] : []);

  return createPortal(
    <div className="rb-ui rb-overlay-layer">
      <div className="rb-cscrim" onClick={onClose} />
      <div className="rb-cols-modal" role="dialog" aria-modal="true">
        <div className="rb-cm-head">
          <div className="rb-cm-title">{t`Choose which columns you see`}</div>
          <div className="rb-cm-sub">
            {t`Pick the columns of this view and the order they appear in.`}
          </div>
        </div>
        <div className="rb-cm-body">
          <div className="rb-cm-left">
            <div className="rb-cm-search">
              <Input
                variant="search"
                size="sm"
                placeholder={t`Search properties`}
                aria-label={t`Search properties`}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <div className="rb-cm-fields">
              {groups.map((group) => {
                const fields = group.fields.filter((field) =>
                  field.label.toLowerCase().includes(term),
                );

                return fields.length === 0 ? null : (
                  <Fragment key={group.id}>
                    <div className="rb-cm-group">{group.title}</div>
                    {fields.map((field) => (
                      <div key={field.id} className="rb-cm-field">
                        <Checkbox
                          checked={draftIds.includes(field.id)}
                          disabled={field.id === labelFieldId}
                          onChange={() => toggle(field.id)}
                        >
                          {field.label}
                        </Checkbox>
                      </div>
                    ))}
                  </Fragment>
                );
              })}
            </div>
          </div>
          <div className="rb-cm-right">
            <div className="rb-cm-rhead">
              <span className="rb-cm-rtitle">
                {t`Selected columns (${draftIds.length})`}
              </span>
              <button
                type="button"
                className="rb-link rb-cm-clear"
                onClick={keepOnlyName}
              >
                {t`Remove all`}
              </button>
            </div>
            <div className="rb-cm-sel">
              {draftIds.map((fieldId, index) => {
                const field = fieldsById.get(fieldId);

                if (!isDefined(field)) {
                  return null;
                }
                const isFrozen = index < draftFrozen;

                return (
                  <div
                    key={fieldId}
                    className={cx('rb-cm-selitem', isFrozen && 'is-frozen')}
                    draggable={index > 0}
                    onDragStart={() => setDraggedIndex(index)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => {
                      if (draggedIndex !== null) {
                        move(draggedIndex, index);
                      }
                      setDraggedIndex(null);
                    }}
                  >
                    <span className="rb-cmdrag">
                      <Icon name="grip" size={14} strokeWidth={3} />
                    </span>
                    <span className="rb-cm-selname">{field.label}</span>
                    {isFrozen && (
                      <span className="rb-cm-frozentag">{t`Frozen`}</span>
                    )}
                    {fieldId !== labelFieldId && (
                      <button
                        type="button"
                        className="rb-cm-selx"
                        aria-label={t`Remove ${field.label}`}
                        onClick={() => toggle(fieldId)}
                      >
                        <Icon name="x" size={14} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="rb-cm-rfoot">
              <Menu
                placement="above"
                entries={Array.from(
                  { length: MAX_FROZEN_COLUMNS + 1 },
                  (_, count) => ({
                    id: String(count),
                    label: String(count),
                    isSelected: count === draftFrozen,
                    onSelect: () => setDraftFrozen(count),
                  }),
                )}
                trigger={({ toggle: toggleMenu, isOpen }) => (
                  <button
                    type="button"
                    className="rb-cm-frozen"
                    aria-expanded={isOpen}
                    onClick={toggleMenu}
                  >
                    {t`Frozen columns: ${draftFrozen}`}
                    <Icon name="caret" size={13} />
                  </button>
                )}
              />
            </div>
          </div>
        </div>
        <div className="rb-cm-foot">
          <button type="button" className="rb-cm-remove" onClick={keepOnlyName}>
            {t`Remove all columns`}
          </button>
          <Link
            className="rb-link rb-cm-create"
            to={`/settings/objects/${objectMetadataItem.namePlural}/new-field/select`}
            onClick={onClose}
          >
            {t`Create a property`} <Icon name="external-link" size={13} />
          </Link>
          <span style={{ flex: 1 }} />
          <Button variant="secondary" onClick={onClose}>
            {t`Cancel`}
          </Button>
          <Button
            variant="primary"
            onClick={() => onApply(draftIds, draftFrozen)}
          >
            {t`Apply`}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
};
