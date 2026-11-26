import { useObjectMetadataItems } from '@/object-metadata/hooks/useObjectMetadataItems';
import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { useFindOneRecord } from '@/object-record/hooks/useFindOneRecord';
import { useUpdateOneRecord } from '@/object-record/hooks/useUpdateOneRecord';
import { getRoboostFieldEditKind } from '@/roboost-app/fields/getRoboostFieldEditKind';
import { getRoboostFieldInputKey } from '@/roboost-app/fields/getRoboostFieldInputKey';
import { RoboostFieldInput } from '@/roboost-app/fields/RoboostFieldInput';
import { getRoboostListRecordGqlFields } from '@/roboost-app/list/utils/getRoboostListRecordGqlFields';
import { RoboostActivityAssociations } from '@/roboost-app/timeline/components/RoboostActivityAssociations';
import { ROBOOST_ACTIVITY_BODY_FIELD_BY_OBJECT } from '@/roboost-app/timeline/constants/RoboostActivityBodyFieldByObject';
import { ROBOOST_ACTIVITY_CARD_FIELD_LIMIT } from '@/roboost-app/timeline/constants/RoboostActivityCardFieldLimit';
import { ROBOOST_ACTIVITY_CARD_FIELD_NAMES } from '@/roboost-app/timeline/constants/RoboostActivityCardFieldNames';
import { formatRoboostFieldValue } from '@/roboost-app/utils/formatRoboostFieldValue';
import { Button } from '@/roboost-ui/components/Button';
import { Icon } from '@/roboost-ui/components/Icon';
import { useLingui } from '@lingui/react/macro';
import { isString } from '@sniptt/guards';
import { useState } from 'react';
import { isDefined } from 'twenty-shared/utils';
import { RelationType } from '~/generated-metadata/graphql';

// A pick from a list is the whole edit, so the list closes and the draft waits for Save
const CLOSE_ON_CHOICE_KINDS = new Set(['select', 'multiSelect', 'rating']);

// Titles head the card; sync and provenance fields are bookkeeping, not part of the activity
const HIDDEN_CARD_FIELD_NAMES = new Set([
  'title',
  'name',
  'recordSource',
  'hubspotId',
  'hubspotHasTranscript',
]);

const getBodyText = (value: unknown) =>
  isString(value)
    ? value
    : ((value as { markdown?: string | null } | null)?.markdown ?? '');

const pickCardFields = (
  objectNameSingular: string,
  fields: FieldMetadataItem[],
  bodyFieldName: string | undefined,
) => {
  const editable = fields.filter(
    (field) =>
      field.isActive &&
      field.name !== bodyFieldName &&
      !HIDDEN_CARD_FIELD_NAMES.has(field.name) &&
      getRoboostFieldEditKind(field) !== null &&
      (!isDefined(field.relation) ||
        field.relation.type === RelationType.MANY_TO_ONE),
  );
  const preferred = ROBOOST_ACTIVITY_CARD_FIELD_NAMES[objectNameSingular] ?? [];

  return [
    ...preferred
      .map((name) => editable.find((field) => field.name === name))
      .filter(isDefined),
    ...editable.filter((field) => !preferred.includes(field.name)),
  ].slice(0, ROBOOST_ACTIVITY_CARD_FIELD_LIMIT);
};

type RoboostActivityExpandedBodyProps = {
  objectNameSingular: string;
  recordId: string;
  canEdit: boolean;
  onSaved: () => void;
};

// Edits are held as a draft; nothing is written until Save
export const RoboostActivityExpandedBody = ({
  objectNameSingular,
  recordId,
  canEdit,
  onSaved,
}: RoboostActivityExpandedBodyProps) => {
  const { t } = useLingui();
  const { objectMetadataItems } = useObjectMetadataItems();
  const { updateOneRecord } = useUpdateOneRecord();
  const [draft, setDraft] = useState<Record<string, unknown>>({});
  const [editingFieldName, setEditingFieldName] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const objectMetadataItem = objectMetadataItems.find(
    (item) => item.nameSingular === objectNameSingular,
  );
  const bodyFieldName =
    ROBOOST_ACTIVITY_BODY_FIELD_BY_OBJECT[objectNameSingular];
  const bodyField = objectMetadataItem?.fields.find(
    (field) => field.name === bodyFieldName && field.isActive,
  );
  const cardFields = pickCardFields(
    objectNameSingular,
    objectMetadataItem?.fields ?? [],
    bodyFieldName,
  );

  const { record, refetch } = useFindOneRecord({
    objectNameSingular,
    objectRecordId: recordId,
    recordGqlFields: isDefined(objectMetadataItem)
      ? getRoboostListRecordGqlFields(
          objectMetadataItem,
          [...cardFields, ...(isDefined(bodyField) ? [bodyField] : [])],
          objectMetadataItems,
        )
      : undefined,
    skip: !isDefined(objectMetadataItem),
  });

  if (!isDefined(record) || !isDefined(objectMetadataItem)) {
    return <div className="rb-actx-loading">{t`Loading…`}</div>;
  }

  const isDirty = Object.keys(draft).length > 0;
  const valueOf = (field: FieldMetadataItem) =>
    field.name in draft
      ? draft[field.name]
      : field.relation?.type === RelationType.MANY_TO_ONE
        ? ((record[field.name] as { id?: string } | null)?.id ?? null)
        : record[field.name];
  const bodyText =
    isDefined(bodyFieldName) && bodyFieldName in draft
      ? String(draft[bodyFieldName] ?? '')
      : getBodyText(isDefined(bodyFieldName) ? record[bodyFieldName] : null);

  const cancel = () => {
    setDraft({});
    setEditingFieldName(null);
    setError(null);
  };

  const save = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const input = Object.fromEntries(
        Object.entries(draft).map(([fieldName, value]) => {
          const field = objectMetadataItem.fields.find(
            (candidate) => candidate.name === fieldName,
          );

          if (fieldName === bodyFieldName && fieldName === 'bodyV2') {
            return [fieldName, { markdown: value, blocknote: null }];
          }

          return [
            isDefined(field) ? getRoboostFieldInputKey(field) : fieldName,
            value,
          ];
        }),
      );

      await updateOneRecord({
        objectNameSingular,
        idToUpdate: recordId,
        updateOneRecordInput: input,
      });
      setDraft({});
      setEditingFieldName(null);
      await refetch();
      onSaved();
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : t`Could not save`,
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="rb-actx">
      {isDefined(bodyField) &&
        (canEdit && editingFieldName === bodyField.name ? (
          <textarea
            className="rb-input rb-actx-body-input"
            autoFocus
            rows={Math.min(12, Math.max(3, bodyText.split('\n').length + 1))}
            value={bodyText}
            aria-label={bodyField.label}
            onChange={(event) =>
              setDraft({ ...draft, [bodyField.name]: event.target.value })
            }
          />
        ) : (
          <div
            className={canEdit ? 'rb-actx-body is-editable' : 'rb-actx-body'}
            role={canEdit ? 'button' : undefined}
            tabIndex={canEdit ? 0 : undefined}
            onClick={() => canEdit && setEditingFieldName(bodyField.name)}
          >
            {bodyText.trim() === '' ? (
              <span className="rb-muted">{t`Add a description…`}</span>
            ) : (
              bodyText
            )}
          </div>
        ))}
      {cardFields.length > 0 && (
        <div className="rb-actx-fields">
          {cardFields.map((field) => (
            <div key={field.id} className="rb-actx-field">
              <div className="rb-actx-label">{field.label}</div>
              {canEdit && editingFieldName === field.name ? (
                <RoboostFieldInput
                  field={field}
                  value={valueOf(field)}
                  autoOpen
                  relatedRecord={
                    record[field.name] as Record<string, unknown> | null
                  }
                  onCancel={() => setEditingFieldName(null)}
                  onChange={(value) => {
                    setDraft({ ...draft, [field.name]: value });
                    if (
                      CLOSE_ON_CHOICE_KINDS.has(
                        getRoboostFieldEditKind(field) ?? '',
                      )
                    ) {
                      setEditingFieldName(null);
                    }
                  }}
                />
              ) : (
                <button
                  type="button"
                  className="rb-actx-value"
                  disabled={!canEdit}
                  onClick={() => setEditingFieldName(field.name)}
                >
                  <span className="rb-truncate">
                    {field.name in draft
                      ? formatRoboostFieldValue(field, draft[field.name], {
                          ...record,
                          ...draft,
                        })
                      : formatRoboostFieldValue(
                          field,
                          record[field.name],
                          record,
                        )}
                  </span>
                  {canEdit && <Icon name="caret" size={12} />}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      {error !== null && <div className="rb-field-error">{error}</div>}
      {isDirty && (
        <div className="rb-actx-save">
          <Button size="sm" variant="ghost" onClick={cancel}>
            {t`Cancel`}
          </Button>
          <Button
            size="sm"
            variant="primary"
            disabled={isSaving}
            onClick={save}
          >
            {t`Save`}
          </Button>
        </div>
      )}
      <div className="rb-actx-foot">
        {/* Comments are not built yet; the entry stays visible */}
        <button type="button" className="rb-actx-comment">
          <Icon name="note" size={14} />
          {t`Add comment`}
        </button>
        <span className="rb-sp" />
        <RoboostActivityAssociations
          objectNameSingular={objectNameSingular}
          recordId={recordId}
          canEdit={canEdit}
        />
      </div>
    </div>
  );
};
