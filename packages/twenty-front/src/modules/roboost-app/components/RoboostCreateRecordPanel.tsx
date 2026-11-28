import { RoboostProductCreatePage } from '@/roboost-app/catalog/components/RoboostProductCreatePage';
import { getRoboostFormsSettingsPath } from '@/roboost-app/layout/utils/getRoboostLayoutSettingsPath';
import { useObjectMetadataItems } from '@/object-metadata/hooks/useObjectMetadataItems';
import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { useCreateOneRecord } from '@/object-record/hooks/useCreateOneRecord';
import { RoboostDuplicateWarning } from '@/roboost-app/components/RoboostDuplicateWarning';
import { getRoboostFieldInputKey } from '@/roboost-app/fields/getRoboostFieldInputKey';
import { isRoboostFieldValueFilled } from '@/roboost-app/fields/isRoboostFieldValueFilled';
import { RoboostFieldInput } from '@/roboost-app/fields/RoboostFieldInput';
import { useRoboostFormFields } from '@/roboost-app/hooks/useRoboostFormFields';
import { getRoboostRuleRequiredFormFields } from '@/roboost-app/fields/utils/getRoboostRuleRequiredFormFields';
import { RoboostDependentPropertiesBox } from '@/roboost-app/record/components/RoboostDependentPropertiesBox';
import { usePropertyLogicRules } from '@/properties/hooks/usePropertyLogicRules';
import { roboostCreatePanelState } from '@/roboost-app/states/roboostCreatePanelState';
import { Button } from '@/roboost-ui/components/Button';
import { Icon } from '@/roboost-ui/components/Icon';
import { useAtomState } from '@/ui/utilities/state/jotai/hooks/useAtomState';
import { gql } from '@apollo/client';
import { useApolloCoreClient } from '@/object-metadata/hooks/useApolloCoreClient';
import { getRoboostPersonName } from '@/roboost-app/utils/getRoboostPersonName';
import { useLingui } from '@lingui/react/macro';
import { isNonEmptyString } from '@sniptt/guards';
import { ROBOOST_OWNERSHIP_FIELDS } from 'twenty-shared/constants';
import { useToast } from 'twenty-ui/components/feedback';
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
  const apolloCoreClient = useApolloCoreClient();
  const { enqueueToast } = useToast();
  const configuredFormFields = useRoboostFormFields(objectMetadataItem);
  const { rules: propertyLogicRules, fields: propertyLogicFields } =
    usePropertyLogicRules(objectMetadataItem);
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

  // Fields a rule makes required show up in the form, right under the field that triggered them
  const formFields = getRoboostRuleRequiredFormFields({
    formFields: configuredFormFields,
    objectMetadataItem,
    values: { ...presetValues, ...values },
    rules: propertyLogicRules,
    fields: propertyLogicFields,
  });
  // Consecutive dependents of one trigger share a box
  const formFieldRuns = formFields.reduce<
    {
      dependentOfFieldName?: string;
      entries: ((typeof formFields)[number] & { index: number })[];
    }[]
  >((runs, formField, index) => {
    const lastRun = runs[runs.length - 1];

    if (
      isDefined(lastRun) &&
      isDefined(formField.dependentOfFieldName) &&
      lastRun.dependentOfFieldName === formField.dependentOfFieldName
    ) {
      lastRun.entries.push({ ...formField, index });
      return runs;
    }

    return [
      ...runs,
      {
        dependentOfFieldName: formField.dependentOfFieldName,
        entries: [{ ...formField, index }],
      },
    ];
  }, []);
  const isCompany = objectMetadataItem.nameSingular === 'company';
  const hasStarted = formFields
    .slice(0, 2)
    .some(({ field }) => isRoboostFieldValueFilled(values[field.name]));
  const isComplete = formFields.every(
    ({ field, isRequired }) =>
      !isRequired || isRoboostFieldValueFilled(values[field.name]),
  );
  const objectLabel = objectMetadataItem.labelSingular;

  const canViewRecord = async (recordId: string) => {
    try {
      const { data } = await apolloCoreClient.query<
        Record<string, { totalCount?: number }>
      >({
        query: gql`
          query RoboostCanViewCreatedRecord($id: UUID!) {
            records: ${objectMetadataItem.namePlural}(filter: { id: { eq: $id } }) {
              totalCount
            }
          }
        `,
        variables: { id: recordId },
        fetchPolicy: 'network-only',
      });

      return (data?.records?.totalCount ?? 0) > 0;
    } catch {
      return false;
    }
  };

  const getCreatedRecordOwnerName = (record: Record<string, unknown>) => {
    const ownerFieldName =
      ROBOOST_OWNERSHIP_FIELDS[objectMetadataItem.nameSingular]?.[0]?.fieldName;

    if (!isDefined(ownerFieldName)) {
      return undefined;
    }
    const picked = relatedRecords[ownerFieldName]?.label;

    if (isNonEmptyString(picked)) {
      return picked;
    }
    const owner = record[ownerFieldName] as {
      name?: Parameters<typeof getRoboostPersonName>[0];
    } | null;

    return isDefined(owner) ? getRoboostPersonName(owner.name) : undefined;
  };

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

      // The owner is never forced, so a rep can create a record their view rule leaves out
      const canOpen = await canViewRecord(record.id);

      if (!canOpen) {
        const ownerName = getCreatedRecordOwnerName(record);

        enqueueToast({
          status: 'info',
          children: isNonEmptyString(ownerName)
            ? t`${objectLabel} created. It's owned by ${ownerName}, so you can't open it.`
            : t`${objectLabel} created. It's unassigned, so you can't open it.`,
        });
      }

      if (addAnother || !canOpen) {
        const labelValue = values[formFields[0]?.field.name ?? ''];

        setLastCreated({
          id: record.id,
          label: typeof labelValue === 'string' ? labelValue : objectLabel,
        });
        setValues({});
        setRelatedRecords({});
        if (!addAnother) {
          onClose();
        }
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
          to={getRoboostFormsSettingsPath(objectMetadataItem.nameSingular)}
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
        {formFieldRuns.map((run) => {
          const renderedFields = run.entries.map(
            ({ field, isRequired, index }) => (
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
            ),
          );

          return isDefined(run.dependentOfFieldName) ? (
            <div
              key={`${run.dependentOfFieldName}-dependents`}
              className="rb-cfield-dep-box"
            >
              <RoboostDependentPropertiesBox>
                {renderedFields}
              </RoboostDependentPropertiesBox>
            </div>
          ) : (
            renderedFields
          );
        })}
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

  if (objectMetadataItem.nameSingular === 'product') {
    return (
      <RoboostProductCreatePage
        objectMetadataItem={objectMetadataItem}
        onClose={close}
      />
    );
  }

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
