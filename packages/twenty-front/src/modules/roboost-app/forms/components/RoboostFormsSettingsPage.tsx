import { useObjectMetadataItems } from '@/object-metadata/hooks/useObjectMetadataItems';
import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { getRoboostFieldEditKind } from '@/roboost-app/fields/getRoboostFieldEditKind';
import { getRoboostLabelIdentifierFieldName } from '@/roboost-app/fields/getRoboostRecordLabel';
import { RoboostFieldInput } from '@/roboost-app/fields/RoboostFieldInput';
import {
  getRoboostDefaultFormConfig,
  getRoboostFormVarKey,
  type RoboostFormConfig,
  type RoboostFormFieldConfig,
} from '@/roboost-app/hooks/useRoboostFormFields';
import { useRoboostUserVars } from '@/roboost-app/hooks/useRoboostUserVars';
import { RoboostLayoutObjectSelect } from '@/roboost-app/layout/components/RoboostLayoutObjectSelect';
import { Button } from '@/roboost-ui/components/Button';
import { Checkbox } from '@/roboost-ui/components/Checkbox';
import { Modal } from '@/roboost-ui/components/Modal';
import { Icon } from '@/roboost-ui/components/Icon';
import { Input } from '@/roboost-ui/components/Input';
import { Toggle } from '@/roboost-ui/components/Toggle';
import { type RoboostIconName } from '@/roboost-ui/types/RoboostIconName';
import { cx } from '@/roboost-ui/utils/cx';
import { useLingui } from '@lingui/react/macro';
import { isNonEmptyString } from '@sniptt/guards';
import { useState } from 'react';
import { getRoboostFormsSettingsPath } from '@/roboost-app/layout/utils/getRoboostLayoutSettingsPath';
import { useNavigate, useParams } from 'react-router-dom';
import { isDefined } from 'twenty-shared/utils';

const FORM_OBJECTS: { nameSingular: string; icon: RoboostIconName }[] = [
  { nameSingular: 'company', icon: 'building' },
  { nameSingular: 'person', icon: 'contacts' },
  { nameSingular: 'opportunity', icon: 'deals' },
  { nameSingular: 'service', icon: 'services' },
  { nameSingular: 'task', icon: 'tasks' },
  { nameSingular: 'note', icon: 'note' },
];

const FIELD_KIND_LABELS: Record<string, string> = {
  text: 'text',
  number: 'number',
  boolean: 'yes / no',
  select: 'dropdown',
  multiSelect: 'multi-select',
  date: 'date',
  dateTime: 'date and time',
  link: 'link',
  email: 'email',
  phone: 'phone',
  currency: 'currency',
  fullName: 'name',
  relation: 'record',
};

const RoboostFormEditor = ({
  objectMetadataItem,
}: {
  objectMetadataItem: EnrichedObjectMetadataItem;
}) => {
  const { t } = useLingui();
  const { getWorkspaceDefault, setWorkspaceDefault } = useRoboostUserVars();
  const varKey = getRoboostFormVarKey(objectMetadataItem.nameSingular);
  const savedConfig = getWorkspaceDefault<RoboostFormConfig>(varKey);
  const initialConfig =
    isDefined(savedConfig) && Array.isArray(savedConfig.fields)
      ? savedConfig
      : getRoboostDefaultFormConfig(objectMetadataItem);
  const [draft, setDraft] = useState<RoboostFormFieldConfig[]>(
    initialConfig.fields,
  );
  const [previewValues, setPreviewValues] = useState<Record<string, unknown>>(
    {},
  );
  const [isAdding, setIsAdding] = useState(false);
  const [search, setSearch] = useState('');
  const [pickedNames, setPickedNames] = useState<string[]>([]);
  const [draggedName, setDraggedName] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>(
    'idle',
  );

  const labelFieldName = getRoboostLabelIdentifierFieldName(objectMetadataItem);
  const editableFields = objectMetadataItem.fields.filter(
    (field) => field.isActive && getRoboostFieldEditKind(field) !== null,
  );
  const findField = (fieldName: string) =>
    editableFields.find((field) => field.name === fieldName);
  const rows = draft
    .map((config) => ({ config, field: findField(config.fieldName) }))
    .filter((row) => isDefined(row.field));
  const addableFields = editableFields
    .filter(
      (field) =>
        !draft.some((config) => config.fieldName === field.name) &&
        field.label.toLowerCase().includes(search.trim().toLowerCase()),
    )
    .sort((first, second) => first.label.localeCompare(second.label));
  const isDirty =
    JSON.stringify(draft) !== JSON.stringify(initialConfig.fields);

  const update = (nextDraft: RoboostFormFieldConfig[]) => {
    setDraft(nextDraft);
    setStatus('idle');
  };

  const closeAddFields = () => {
    setIsAdding(false);
    setSearch('');
    setPickedNames([]);
  };

  const addFields = (fieldNames: string[]) => {
    update([
      ...draft,
      ...fieldNames.map((fieldName) => ({ fieldName, isRequired: false })),
    ]);
    closeAddFields();
  };

  const moveTo = (targetName: string) => {
    if (!isDefined(draggedName) || draggedName === targetName) {
      return;
    }
    const dragged = draft.find((config) => config.fieldName === draggedName);

    if (!isDefined(dragged)) {
      return;
    }
    const remaining = draft.filter(
      (config) => config.fieldName !== draggedName,
    );
    const targetIndex = remaining.findIndex(
      (config) => config.fieldName === targetName,
    );
    const draggedFromIndex = draft.indexOf(dragged);
    const targetFromIndex = draft.findIndex(
      (config) => config.fieldName === targetName,
    );

    remaining.splice(
      draggedFromIndex < targetFromIndex ? targetIndex + 1 : targetIndex,
      0,
      dragged,
    );
    update(remaining);
  };

  const save = async () => {
    setStatus('saving');
    try {
      await setWorkspaceDefault(varKey, { fields: draft });
      setStatus('saved');
    } catch {
      setStatus('error');
    }
  };

  return (
    <>
      <section className="rb-forms-card rb-forms-fields-panel">
        <div className="rb-forms-card-head">
          {t`${objectMetadataItem.labelPlural} · create form fields`}
        </div>
        <div className="rb-forms-card-body">
          <p className="rb-forms-hint">
            {t`Drag to reorder. Toggle Required to make a field mandatory. These fields power the Create ${objectMetadataItem.labelSingular} panel.`}
          </p>
          {rows.map(({ config, field }) => {
            const kind = isDefined(field)
              ? getRoboostFieldEditKind(field)
              : null;
            const isLabelField = config.fieldName === labelFieldName;

            return (
              <div
                key={config.fieldName}
                className={cx(
                  'rb-forms-row',
                  draggedName === config.fieldName && 'is-dragging',
                )}
                draggable
                onDragStart={() => setDraggedName(config.fieldName)}
                onDragOver={(event) => {
                  event.preventDefault();
                  moveTo(config.fieldName);
                }}
                onDragEnd={() => setDraggedName(null)}
              >
                <span className="rb-rc-drag">
                  <Icon name="grip" size={14} />
                </span>
                <span className="rb-forms-name">
                  {field?.label}
                  {isDefined(kind) && (
                    <span className="rb-forms-kind">
                      {' · '}
                      {FIELD_KIND_LABELS[kind] ?? kind}
                    </span>
                  )}
                </span>
                <span className="rb-forms-req">{t`Required`}</span>
                <Toggle
                  checked={config.isRequired || isLabelField}
                  disabled={isLabelField}
                  aria-label={t`${field?.label ?? ''} required`}
                  onChange={(isRequired) =>
                    update(
                      draft.map((candidate) =>
                        candidate.fieldName === config.fieldName
                          ? { ...candidate, isRequired }
                          : candidate,
                      ),
                    )
                  }
                />
                <button
                  type="button"
                  className="rb-rc-iconbtn"
                  disabled={isLabelField}
                  aria-label={t`Remove ${field?.label ?? ''}`}
                  onClick={() =>
                    update(
                      draft.filter(
                        (candidate) => candidate.fieldName !== config.fieldName,
                      ),
                    )
                  }
                >
                  <Icon name="x" size={15} />
                </button>
              </div>
            );
          })}
          <div className="rb-forms-add">
            <button
              type="button"
              className="rb-addcol-btn"
              aria-expanded={isAdding}
              onClick={() => setIsAdding(!isAdding)}
            >
              <Icon name="plus" size={13} strokeWidth={2} />
              {t`Add field`}
            </button>
            {isAdding && (
              <Modal
                title={t`Add fields`}
                subtitle={t`Click a field to add it, or tick several and press Add.`}
                width={480}
                className="rb-forms-addmodal"
                onClose={closeAddFields}
                footer={
                  <>
                    <Button variant="secondary" onClick={closeAddFields}>
                      {t`Cancel`}
                    </Button>
                    <Button
                      variant="primary"
                      disabled={pickedNames.length === 0}
                      onClick={() => addFields(pickedNames)}
                    >
                      {pickedNames.length > 0
                        ? t`Add ${pickedNames.length}`
                        : t`Add`}
                    </Button>
                  </>
                }
              >
                <div className="rb-forms-addmodal-search">
                  <Input
                    variant="search"
                    size="sm"
                    value={search}
                    placeholder={t`Search fields`}
                    aria-label={t`Search fields`}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </div>
                <div className="rb-forms-addmodal-list">
                  {addableFields.map((field) => {
                    const kind = getRoboostFieldEditKind(field);
                    const isPicked = pickedNames.includes(field.name);

                    return (
                      <div
                        key={field.id}
                        className={cx(
                          'rb-forms-addmodal-item',
                          isPicked && 'is-picked',
                        )}
                      >
                        <Checkbox
                          aria-label={t`Select ${field.label}`}
                          checked={isPicked}
                          onChange={(checked) =>
                            setPickedNames(
                              checked
                                ? [...pickedNames, field.name]
                                : pickedNames.filter(
                                    (name) => name !== field.name,
                                  ),
                            )
                          }
                        />
                        <button
                          type="button"
                          className="rb-forms-addmodal-name"
                          onClick={() => addFields([field.name])}
                        >
                          <span className="rb-truncate">{field.label}</span>
                          <span className="rb-forms-kind">
                            {isDefined(kind)
                              ? (FIELD_KIND_LABELS[kind] ?? kind)
                              : ''}
                          </span>
                        </button>
                      </div>
                    );
                  })}
                  {addableFields.length === 0 && (
                    <div className="rb-forms-hint">{t`No more fields to add.`}</div>
                  )}
                </div>
              </Modal>
            )}
          </div>
        </div>
        <div className="rb-forms-card-foot">
          <Button
            variant="primary"
            disabled={!isDirty || status === 'saving'}
            onClick={save}
          >
            {status === 'saving' ? t`Saving…` : t`Save form`}
          </Button>
          <Button
            variant="ghost"
            onClick={() =>
              update(getRoboostDefaultFormConfig(objectMetadataItem).fields)
            }
          >
            {t`Reset to default`}
          </Button>
          {status === 'saved' && (
            <span className="rb-forms-status">{t`Saved for everyone`}</span>
          )}
          {status === 'error' && (
            <span className="rb-forms-status is-error">
              {t`Only workspace admins can change forms.`}
            </span>
          )}
        </div>
      </section>
      <section className="rb-forms-card rb-forms-preview-panel">
        <div className="rb-forms-card-head">
          <span className="rb-forms-live" />
          {t`Live preview`}
          <span className="rb-sp" />
          <span className="rb-forms-kind">
            {t`Create ${objectMetadataItem.labelSingular}`}
          </span>
        </div>
        <div className="rb-forms-card-body rb-forms-preview">
          {rows.map(({ config, field }) =>
            isDefined(field) ? (
              <div key={config.fieldName} className="rb-cfield">
                <span className="rb-act-label">
                  {field.label}
                  {(config.isRequired ||
                    config.fieldName === labelFieldName) && (
                    <span className="rb-forms-star"> *</span>
                  )}
                </span>
                <RoboostFieldInput
                  field={field}
                  value={previewValues[field.name]}
                  onChange={(value) =>
                    setPreviewValues({ ...previewValues, [field.name]: value })
                  }
                />
              </div>
            ) : null,
          )}
        </div>
        <div className="rb-forms-card-foot">
          <Button variant="primary" disabled>
            {t`Create`}
          </Button>
          <Button variant="ghost" disabled>
            {t`Cancel`}
          </Button>
        </div>
      </section>
    </>
  );
};

// Settings → Layout → Forms: the create form of each object, saved for the whole workspace
export const RoboostFormsSettingsPage = () => {
  const { t } = useLingui();
  const { objectNameSingular } = useParams<{ objectNameSingular?: string }>();
  const { objectMetadataItems } = useObjectMetadataItems();

  const formObjects = FORM_OBJECTS.map(({ nameSingular, icon }) => ({
    icon,
    item: objectMetadataItems.find(
      (candidate) =>
        candidate.nameSingular === nameSingular && candidate.isActive,
    ),
  })).filter(
    (
      entry,
    ): entry is { icon: RoboostIconName; item: EnrichedObjectMetadataItem } =>
      isDefined(entry.item),
  );
  const selected =
    formObjects.find(
      (entry) => entry.item.nameSingular === objectNameSingular,
    ) ?? formObjects[0];

  const navigate = useNavigate();

  return (
    <>
      {isDefined(selected) && (
        <RoboostLayoutObjectSelect
          objects={formObjects.map(({ item }) => item)}
          value={selected.item.nameSingular}
          onChange={(nameSingular) =>
            navigate(getRoboostFormsSettingsPath(nameSingular))
          }
        />
      )}
      <p className="rb-forms-sub">
        {t`Choose which fields appear when a rep creates a record, their order, and which are required.`}
      </p>
      <div className="rb-forms-grid rb-forms-grid-split">
        {isDefined(selected) && isNonEmptyString(selected.item.id) && (
          <RoboostFormEditor
            key={selected.item.nameSingular}
            objectMetadataItem={selected.item}
          />
        )}
      </div>
    </>
  );
};
