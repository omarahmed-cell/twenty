import { useObjectMetadataItems } from '@/object-metadata/hooks/useObjectMetadataItems';
import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { useCreateOneRecord } from '@/object-record/hooks/useCreateOneRecord';
import { RoboostDuplicateWarning } from '@/roboost-app/components/RoboostDuplicateWarning';
import { getRoboostFieldInputKey } from '@/roboost-app/fields/getRoboostFieldInputKey';
import { isRoboostFieldValueFilled } from '@/roboost-app/fields/isRoboostFieldValueFilled';
import { RoboostFieldInput } from '@/roboost-app/fields/RoboostFieldInput';
import { useRoboostFormFields } from '@/roboost-app/hooks/useRoboostFormFields';
import { roboostCreatePanelState } from '@/roboost-app/states/roboostCreatePanelState';
import { Button } from '@/roboost-ui/components/Button';
import { Icon } from '@/roboost-ui/components/Icon';
import { useAtomState } from '@/ui/utilities/state/jotai/hooks/useAtomState';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { AppPath } from 'twenty-shared/types';
import { getAppPath, isDefined } from 'twenty-shared/utils';
import { useNavigateApp } from '~/hooks/useNavigateApp';

type RoboostCreateRecordFormProps = {
  objectMetadataItem: EnrichedObjectMetadataItem;
  presetValues: Record<string, unknown>;
  linkToRecord?: { objectNameSingular: string; recordId: string };
  initialValues?: Record<string, unknown>;
  initialRelatedRecords?: Record<string, { id: string; label: string } | null>;
  onClose: () => void;
};

const RoboostCreateRecordForm = ({
  objectMetadataItem,
  presetValues,
  linkToRecord,
  initialValues,
  initialRelatedRecords,
  onClose,
}: RoboostCreateRecordFormProps) => {
  const { t } = useLingui();
  const navigateApp = useNavigateApp();
  const formFields = useRoboostFormFields(objectMetadataItem);
  const { createOneRecord } = useCreateOneRecord({
    objectNameSingular: objectMetadataItem.nameSingular,
  });
  const { objectMetadataItems } = useObjectMetadataItems();
  const junctionObjectNameSingular = `${objectMetadataItem.nameSingular}Target`;
  const hasJunction = objectMetadataItems.some(
    (item) => item.nameSingular === junctionObjectNameSingular,
  );
  const { createOneRecord: createJunctionRecord } = useCreateOneRecord({
    objectNameSingular: hasJunction
      ? junctionObjectNameSingular
      : objectMetadataItem.nameSingular,
  });
  const [values, setValues] = useState<Record<string, unknown>>(
    initialValues ?? {},
  );
  const [relatedRecords, setRelatedRecords] = useState<
    Record<string, { id: string; label: string } | null>
  >(initialRelatedRecords ?? {});
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastCreated, setLastCreated] = useState<{
    id: string;
    label: string;
  } | null>(null);

  const isCompany = objectMetadataItem.nameSingular === 'company';
  const hasStarted = formFields
    .slice(0, 2)
    .some(({ field }) => isRoboostFieldValueFilled(values[field.name]));
  const isComplete = formFields.every(
    ({ field, isRequired }) =>
      !isRequired || isRoboostFieldValueFilled(values[field.name]),
  );
  const objectLabel = objectMetadataItem.labelSingular;

  const create = async (addAnother: boolean) => {
    setIsSaving(true);
    setError(null);

    try {
      const input: Record<string, unknown> = { ...presetValues };

      for (const { field } of formFields) {
        if (isRoboostFieldValueFilled(values[field.name])) {
          input[getRoboostFieldInputKey(field)] = values[field.name];
        }
      }
      const record = await createOneRecord(input);

      if (isDefined(linkToRecord) && hasJunction) {
        const targetName = linkToRecord.objectNameSingular;

        await createJunctionRecord({
          [`${objectMetadataItem.nameSingular}Id`]: record.id,
          [`target${targetName.charAt(0).toUpperCase()}${targetName.slice(1)}Id`]:
            linkToRecord.recordId,
        });
      }

      if (addAnother) {
        const labelValue = values[formFields[0]?.field.name ?? ''];

        setLastCreated({
          id: record.id,
          label: typeof labelValue === 'string' ? labelValue : objectLabel,
        });
        setValues({});
        setRelatedRecords({});
      } else {
        onClose();
        navigateApp(AppPath.RecordShowPage, {
          objectNameSingular: objectMetadataItem.nameSingular,
          objectRecordId: record.id,
        });
      }
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : t`The record could not be created`,
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="rb-cpanel" role="dialog" aria-modal="true">
      <div className="rb-cpanel-head">
        <div className="rb-cpanel-title">{t`Create ${objectLabel}`}</div>
        <button
          type="button"
          className="rb-cpanel-close"
          aria-label={t`Close`}
          onClick={onClose}
        >
          <Icon name="x" size={16} />
        </button>
      </div>
      <div className="rb-cpanel-editform">
        <Link
          className="rb-link"
          to={`/settings/forms/${objectMetadataItem.namePlural}`}
          onClick={onClose}
        >
          {t`Edit this form`} <Icon name="external-link" size={12} />
        </Link>
      </div>
      <div className="rb-cpanel-body">
        {lastCreated !== null && (
          <div className="rb-cpanel-created">
            <Icon name="check-circle" size={16} />
            <span>
              {t`${lastCreated.label} created`} ·{' '}
              <Link
                className="rb-link"
                onClick={onClose}
                to={getAppPath(AppPath.RecordShowPage, {
                  objectNameSingular: objectMetadataItem.nameSingular,
                  objectRecordId: lastCreated.id,
                })}
              >
                {t`Open it`}
              </Link>
            </span>
          </div>
        )}
        {formFields.map(({ field, isRequired }, index) => (
          <div key={field.id}>
            <div
              className={`rb-cfield ${isCompany && !hasStarted && index >= 2 ? 'is-greyed' : ''}`}
            >
              <label className="rb-cflabel">
                {field.label}
                {isRequired && <span className="rb-req"> *</span>}
              </label>
              <RoboostFieldInput
                field={field}
                value={values[field.name]}
                relatedRecord={
                  isDefined(relatedRecords[field.name])
                    ? {
                        id: relatedRecords[field.name]?.id,
                        name: relatedRecords[field.name]?.label,
                      }
                    : null
                }
                onChange={(value, relatedRecord) => {
                  setValues({ ...values, [field.name]: value });
                  if (relatedRecord !== undefined) {
                    setRelatedRecords({
                      ...relatedRecords,
                      [field.name]: relatedRecord,
                    });
                  }
                }}
              />
              <RoboostDuplicateWarning
                objectMetadataItem={objectMetadataItem}
                field={field}
                value={values[field.name]}
                onOpen={onClose}
              />
            </div>
            {isCompany && !hasStarted && index === 1 && (
              <div className="rb-cpanel-hint">
                {t`Start by entering a domain name, an account name, or both.`}
              </div>
            )}
          </div>
        ))}
        {error !== null && <div className="rb-field-error">{error}</div>}
      </div>
      <div className="rb-cpanel-foot">
        <Button
          variant="primary"
          disabled={!isComplete || isSaving}
          onClick={() => create(false)}
        >
          {t`Create`}
        </Button>
        <Button
          variant="secondary"
          disabled={!isComplete || isSaving}
          onClick={() => create(true)}
        >
          {t`Create and add another`}
        </Button>
        <span style={{ flex: 1 }} />
        <Button variant="ghost" onClick={onClose}>
          {t`Cancel`}
        </Button>
      </div>
    </div>
  );
};

// Nothing is saved until Create; closing or Cancel drops the draft
export const RoboostCreateRecordPanel = () => {
  const [roboostCreatePanel, setRoboostCreatePanel] = useAtomState(
    roboostCreatePanelState,
  );
  const { objectMetadataItems } = useObjectMetadataItems();

  if (roboostCreatePanel === null) {
    return null;
  }

  const objectMetadataItem = objectMetadataItems.find(
    (item) => item.nameSingular === roboostCreatePanel.objectNameSingular,
  );

  if (!isDefined(objectMetadataItem)) {
    return null;
  }

  const close = () => setRoboostCreatePanel(null);

  return createPortal(
    <div className="rb-ui rb-cpanel-layer">
      <div className="rb-cscrim" onClick={close} />
      <RoboostCreateRecordForm
        key={objectMetadataItem.id}
        objectMetadataItem={objectMetadataItem}
        presetValues={roboostCreatePanel.presetValues ?? {}}
        linkToRecord={roboostCreatePanel.linkToRecord}
        initialValues={roboostCreatePanel.initialValues}
        initialRelatedRecords={roboostCreatePanel.initialRelatedRecords}
        onClose={close}
      />
    </div>,
    document.body,
  );
};
