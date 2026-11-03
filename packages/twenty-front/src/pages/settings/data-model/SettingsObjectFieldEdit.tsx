import { WorkspaceRouteUnavailable } from '@/ui/layout/page/components/WorkspaceRouteUnavailable';
import { isValidReturnToPath } from '@/auth/utils/isValidReturnToPath';
import { isDDLLockedState } from '@/client-config/states/isDDLLockedState';
import { useFieldMetadataItem } from '@/object-metadata/hooks/useFieldMetadataItem';
import { useFilteredObjectMetadataItems } from '@/object-metadata/hooks/useFilteredObjectMetadataItems';
import { useGetIsMetadataItemCustom } from '@/object-metadata/hooks/useGetIsMetadataItemCustom';
import { useGetRelationMetadata } from '@/object-metadata/hooks/useGetRelationMetadata';
import { useUpdateOneFieldMetadataItem } from '@/object-metadata/hooks/useUpdateOneFieldMetadataItem';
import { formatFieldMetadataItemInput } from '@/object-metadata/utils/formatFieldMetadataItemInput';
import { isLabelIdentifierField } from '@/object-metadata/utils/isLabelIdentifierField';
import {
  FORMULA_FORM_DEFAULT_SETTINGS,
  getFormulaFormDefaultValue,
} from '@/settings/data-model/fields/forms/formula/utils/getFormulaFormDefaults';
import { isObjectMetadataReadOnly } from '@/object-record/read-only/utils/isObjectMetadataReadOnly';
import { resolveJunctionConfig } from '@/object-record/record-field/ui/utils/junction/resolveJunctionConfig';
import { SaveAndCancelButtons } from '@/settings/components/SaveAndCancelButtons/SaveAndCancelButtons';
import { SettingsPageContainer } from '@/settings/components/SettingsPageContainer';
import { SettingsPageLayout } from '@/settings/components/layout/SettingsPageLayout';
import { FIELD_NAME_MAXIMUM_LENGTH } from '@/settings/data-model/constants/FieldNameMaximumLength';
import { SettingsDataModelFieldDescriptionForm } from '@/settings/data-model/fields/forms/components/SettingsDataModelFieldDescriptionForm';
import { SettingsDataModelFieldIconLabelForm } from '@/settings/data-model/fields/forms/components/SettingsDataModelFieldIconLabelForm';
import { SettingsDataModelFieldSettingsFormCard } from '@/settings/data-model/fields/forms/components/SettingsDataModelFieldSettingsFormCard';
import { SettingsDataModelFieldFormulaForm } from '@/settings/data-model/fields/forms/formula/components/SettingsDataModelFieldFormulaForm';
import { SettingsDataModelFieldFormulaResyncButton } from '@/settings/data-model/fields/forms/formula/components/SettingsDataModelFieldFormulaResyncButton';
import {
  getComputedGraphFields,
  getFieldFormulaSettings,
  validateFormula,
} from '@/settings/data-model/fields/forms/formula/utils/validateFormula';
import {
  SettingsDataModelFieldSyncForm,
  type SettingsDataModelFieldSyncFormValue,
} from '@/settings/data-model/fields/forms/sync/components/SettingsDataModelFieldSyncForm';
import { SettingsDataModelFieldSyncResyncButton } from '@/settings/data-model/fields/forms/sync/components/SettingsDataModelFieldSyncResyncButton';
import {
  getFieldSyncSettings,
  getSyncFormValueFromField,
} from '@/settings/data-model/fields/forms/sync/utils/getSyncFormValueFromField';
import { settingsFieldFormSchema } from '@/settings/data-model/fields/forms/validation-schemas/settingsFieldFormSchema';
import { type SettingsDataModelFieldEditFormValues } from '@/settings/data-model/types/SettingsDataModelFieldEditFormValues';
import { type SettingsFieldType } from '@/settings/data-model/types/SettingsFieldType';
import { SettingsTranslationsCard } from '@/settings/translations/components/SettingsTranslationsCard';
import { ConfirmationDialog } from '@/ui/layout/dialog/components/ConfirmationDialog';
import { useDialog } from '@/ui/layout/dialog/hooks/useDialog';
import { useWorkspaceSurface } from '@/ui/layout/hooks/useWorkspaceSurface';
import { navigationMemorizedUrlState } from '@/ui/navigation/states/navigationMemorizedUrlState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { zodResolver } from '@hookform/resolvers/zod';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import omit from 'lodash.omit';
import { useEffect, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { AppPath, SettingsPath } from 'twenty-shared/types';
import {
  FORMULA_OUTPUT_FIELD_TYPES,
  type FormulaOutputFieldType,
  findComputedFieldCycleMembers,
  getSettingsPath,
  isDefined,
  isEmptyObject,
} from 'twenty-shared/utils';
import { useToast } from 'twenty-ui/components/feedback';
import { Section } from 'twenty-ui/components/layout';
import { IconArchive, IconArchiveOff, IconTrash } from 'twenty-ui/icon';
import { Button } from 'twenty-ui/primitives/input';
import { themeCssVariables } from 'twenty-ui/theme';
import { FieldMetadataType, RelationType } from '~/generated-metadata/graphql';
import { useNavigateApp } from '~/hooks/useNavigateApp';
import { useNavigateSettings } from '~/hooks/useNavigateSettings';
import { getFieldMetadataItemInitialValues } from '@/settings/data-model/fields/forms/utils/getFieldMetadataItemInitialValues';

const DELETE_FIELD_MODAL_ID = 'delete-field-confirmation-modal';
const StyledSyncActions = styled.div`
  margin-top: ${themeCssVariables.spacing[4]};
`;

const StyledDangerButtons = styled.div`
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
`;

export const SettingsObjectFieldEdit = () => {
  const navigateSettings = useNavigateSettings();
  const navigateApp = useNavigateApp();
  const workspaceSurface = useWorkspaceSurface();
  const { t } = useLingui();

  const { openDialog, closeDialog } = useDialog();
  const { enqueueToast } = useToast();

  const navigate = useNavigate();
  const location = useLocation();
  const stateReturnTo =
    typeof location.state === 'object' &&
    location.state !== null &&
    'returnTo' in location.state &&
    typeof location.state.returnTo === 'string' &&
    isValidReturnToPath(location.state.returnTo)
      ? location.state.returnTo
      : undefined;
  const navigationMemorizedUrl = useAtomStateValue(navigationMemorizedUrlState);
  const returnTo =
    stateReturnTo ??
    (workspaceSurface.type === 'main' &&
    isValidReturnToPath(navigationMemorizedUrl)
      ? navigationMemorizedUrl
      : undefined);

  const { objectNamePlural = '', fieldName = '' } = useParams();

  const { findObjectMetadataItemByNamePlural, objectMetadataItems } =
    useFilteredObjectMetadataItems();

  const objectMetadataItem =
    findObjectMetadataItemByNamePlural(objectNamePlural);

  const isDDLLocked = useAtomStateValue(isDDLLockedState);

  const readonly =
    isObjectMetadataReadOnly({
      objectMetadataItem,
    }) || isDDLLocked;

  const {
    deactivateMetadataField,
    activateMetadataField,
    deleteMetadataField,
  } = useFieldMetadataItem();

  const [newNameDuringSave, setNewNameDuringSave] = useState<string | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [formulaDraft, setFormulaDraft] = useState<string | null>(null);
  const [syncFormDraft, setSyncFormDraft] =
    useState<SettingsDataModelFieldSyncFormValue | null>(null);

  const fieldMetadataItem = objectMetadataItem?.fields.find(
    (fieldMetadataItem) =>
      fieldMetadataItem.name === fieldName ||
      fieldMetadataItem.name === newNameDuringSave,
  );

  const isReverseJunctionRelation =
    resolveJunctionConfig({
      settings: fieldMetadataItem?.settings,
      relationObjectMetadataId:
        fieldMetadataItem?.relation?.targetObjectMetadata.id ?? '',
      relationTargetFieldMetadataId:
        fieldMetadataItem?.relation?.targetFieldMetadata.id,
      sourceObjectMetadataId: objectMetadataItem?.id,
      objectMetadataItems,
    })?.direction === 'reverse';

  const getRelationMetadata = useGetRelationMetadata();
  const { updateOneFieldMetadataItem } = useUpdateOneFieldMetadataItem();
  const getIsMetadataItemCustom = useGetIsMetadataItemCustom();

  const { settings, defaultValue } =
    getFieldMetadataItemInitialValues(fieldMetadataItem);

  const isSyncField = isDefined(getFieldSyncSettings(fieldMetadataItem));
  const savedFormula = getFieldFormulaSettings(fieldMetadataItem);
  const isFormulaField = isDefined(savedFormula);

  const formConfig = useForm<SettingsDataModelFieldEditFormValues>({
    mode: 'onTouched',
    resolver: zodResolver(settingsFieldFormSchema()),
    defaultValues: {
      icon: fieldMetadataItem?.icon ?? 'Icon',
      type: fieldMetadataItem?.type as SettingsFieldType,
      label: fieldMetadataItem?.label ?? '',
      description: fieldMetadataItem?.description,
      isLabelSyncedWithName: fieldMetadataItem?.isLabelSyncedWithName ?? true,
      settings,
      defaultValue,
      // The cards that normally fill these are not rendered for synced fields.
      ...(isFormulaField
        ? {
            settings: { ...FORMULA_FORM_DEFAULT_SETTINGS, ...settings },
            options: fieldMetadataItem?.options ?? [],
            defaultValue:
              fieldMetadataItem?.type === FieldMetadataType.CURRENCY
                ? fieldMetadataItem.defaultValue
                : getFormulaFormDefaultValue(
                    fieldMetadataItem?.type as FormulaOutputFieldType,
                  ),
          }
        : {}),
      ...(isSyncField
        ? {
            settings: { displayedMaxRows: null, ...settings },
            options: fieldMetadataItem?.options ?? [],
            defaultValue: fieldMetadataItem?.defaultValue ?? null,
          }
        : {}),
    } as SettingsDataModelFieldEditFormValues,
  });

  useEffect(() => {
    if (
      workspaceSurface.type === 'main' &&
      !isDeleting &&
      (!objectMetadataItem || !fieldMetadataItem)
    ) {
      navigateApp(AppPath.NotFound);
    }
  }, [
    navigateApp,
    objectMetadataItem,
    fieldMetadataItem,
    isDeleting,
    workspaceSurface.type,
  ]);

  const { isValid, isSubmitting, dirtyFields } = formConfig.formState;

  const isDirty = !isEmptyObject(dirtyFields);

  const isFormulaDraftValid =
    !isDefined(formulaDraft) ||
    (isDefined(objectMetadataItem) &&
      validateFormula({
        expression: formulaDraft,
        objectMetadataItem,
        objectMetadataItems,
        targetField: fieldMetadataItem,
      }).status === 'valid');

  const canSave =
    (isDirty || isDefined(syncFormDraft) || isDefined(formulaDraft)) &&
    isFormulaDraftValid &&
    (!isDefined(syncFormDraft) || isDefined(syncFormDraft.sourceField)) &&
    isValid &&
    !isSubmitting;

  if (!isDefined(objectMetadataItem) || !isDefined(fieldMetadataItem)) {
    return workspaceSurface.type === 'side-panel' ? (
      <WorkspaceRouteUnavailable />
    ) : null;
  }

  const isCustomField = getIsMetadataItemCustom(fieldMetadataItem);

  const fieldLabel = fieldMetadataItem.label;
  const objectLabel = objectMetadataItem.labelPlural;

  const isLabelIdentifier = isLabelIdentifierField({
    fieldMetadataItem: fieldMetadataItem,
    objectMetadataItem: objectMetadataItem,
  });

  const fieldNamesThatCannotBeDeactivated = [
    'createdAt',
    'createdBy',
    'deletedAt',
    'updatedAt',
  ];

  const fieldCanBeDeactivated = !fieldNamesThatCannotBeDeactivated.includes(
    fieldMetadataItem.name,
  );

  const savedSyncFormValue = getSyncFormValueFromField(
    fieldMetadataItem,
    objectMetadataItem,
    objectMetadataItems,
  );

  const isFormulaOutputField = (
    FORMULA_OUTPUT_FIELD_TYPES as readonly FieldMetadataType[]
  ).includes(fieldMetadataItem.type);

  const isFormulaPaused =
    isFormulaField &&
    validateFormula({
      expression: savedFormula.expression,
      objectMetadataItem,
      objectMetadataItems,
      targetField: fieldMetadataItem,
    }).status === 'invalid';

  const isSyncPaused =
    isSyncField &&
    (!isDefined(savedSyncFormValue.sourceField) ||
      findComputedFieldCycleMembers(
        getComputedGraphFields(objectMetadataItems),
      ).has(fieldMetadataItem.id));

  const handleSave = async (
    formValues: SettingsDataModelFieldEditFormValues,
  ) => {
    if (readonly) {
      return;
    }

    const { dirtyFields } = formConfig.formState;
    setNewNameDuringSave(formValues.name);

    if (
      formValues.type === FieldMetadataType.RELATION &&
      'relation' in formValues &&
      'relation' in dirtyFields
    ) {
      const { relationFieldMetadataItem } =
        getRelationMetadata({
          fieldMetadataItem: fieldMetadataItem,
        }) ?? {};

      if (isDefined(relationFieldMetadataItem)) {
        const result = await updateOneFieldMetadataItem({
          objectMetadataId: objectMetadataItem.id,
          fieldMetadataIdToUpdate: relationFieldMetadataItem.id,
          updatePayload: formValues.relation.field,
        });

        if (result.status === 'failed') {
          return;
        }
      }
    }

    const otherDirtyFields = omit(dirtyFields, 'relation');

    if (
      Object.keys(otherDirtyFields).length > 0 ||
      isDefined(syncFormDraft) ||
      isDefined(formulaDraft)
    ) {
      const formattedInput = Object.fromEntries(
        Object.entries(formatFieldMetadataItemInput(formValues)).filter(
          ([key]) => Object.keys(otherDirtyFields).includes(key),
        ),
      );

      const updateResult = await updateOneFieldMetadataItem({
        objectMetadataId: objectMetadataItem.id,
        fieldMetadataIdToUpdate: fieldMetadataItem.id,
        updatePayload: {
          ...formattedInput,
          ...(isFormulaField
            ? {
                settings: {
                  ...fieldMetadataItem.settings,
                  ...formattedInput.settings,
                  formula: {
                    expression: formulaDraft ?? savedFormula.expression,
                  },
                },
              }
            : {}),
          ...(isDefined(syncFormDraft?.sourceField) &&
          isDefined(syncFormDraft.relationFieldMetadataId)
            ? {
                settings: {
                  ...fieldMetadataItem.settings,
                  sync: {
                    relationFieldMetadataId:
                      syncFormDraft.relationFieldMetadataId,
                    sourceFieldMetadataId: syncFormDraft.sourceField.id,
                    ...(objectMetadataItem.fields.find(
                      ({ id }) => id === syncFormDraft.relationFieldMetadataId,
                    )?.relation?.type === RelationType.ONE_TO_MANY
                      ? {
                          policy:
                            syncFormDraft.policy ?? 'MOST_RECENTLY_CREATED',
                        }
                      : {}),
                  },
                },
              }
            : {}),
        },
      });

      if (updateResult.status === 'successful') {
        navigateBackOrToSettings();
      }
    }
  };

  const navigateBackOrToSettings = () => {
    if (isDefined(returnTo)) {
      navigate(returnTo, { replace: true });
      return;
    }

    navigateSettings(SettingsPath.ObjectDetail, {
      objectNamePlural,
    });
  };

  const handleCancel = () => {
    navigateBackOrToSettings();
  };

  const handleDeactivate = async () => {
    if (readonly) {
      return;
    }

    const deactivationResult = await deactivateMetadataField(
      fieldMetadataItem.id,
      objectMetadataItem.id,
    );
    if (deactivationResult.status === 'successful') {
      navigateSettings(SettingsPath.ObjectDetail, {
        objectNamePlural,
      });
    }
  };

  const handleActivate = async () => {
    if (readonly) {
      return;
    }

    const activationResult = await activateMetadataField(
      fieldMetadataItem.id,
      objectMetadataItem.id,
    );

    if (activationResult.status === 'successful') {
      navigateSettings(SettingsPath.ObjectDetail, {
        objectNamePlural,
      });
    }
  };

  const handleDelete = () => {
    if (readonly || !isCustomField) {
      return;
    }

    openDialog(DELETE_FIELD_MODAL_ID);
  };

  const confirmDelete = async () => {
    if (!isDefined(objectMetadataItem) || !isDefined(fieldMetadataItem)) {
      return;
    }

    setIsDeleting(true);

    const deleteResult = await deleteMetadataField({
      idToDelete: fieldMetadataItem.id,
    });

    if (deleteResult.status === 'successful') {
      enqueueToast({ status: 'success', children: t`Field deleted` });
      closeDialog(DELETE_FIELD_MODAL_ID);
      navigateSettings(SettingsPath.ObjectDetail, {
        objectNamePlural,
      });
      return;
    }

    setIsDeleting(false);
    closeDialog(DELETE_FIELD_MODAL_ID);
  };

  return (
    <>
      {/* oxlint-disable-next-line react/jsx-props-no-spreading */}
      <FormProvider {...formConfig}>
        <SettingsPageLayout
          title={fieldMetadataItem?.label}
          links={[
            {
              children: t`Workspace`,
              href: getSettingsPath(SettingsPath.General),
            },
            {
              children: t`Objects`,
              href: getSettingsPath(SettingsPath.Objects),
            },
            {
              children: objectMetadataItem.labelPlural,
              href: getSettingsPath(SettingsPath.ObjectDetail, {
                objectNamePlural,
              }),
            },
            {
              children: fieldMetadataItem.label,
            },
          ]}
          actionButton={
            <SaveAndCancelButtons
              isLoading={isSubmitting}
              isSaveDisabled={!canSave || readonly}
              isCancelDisabled={isSubmitting || readonly}
              onCancel={handleCancel}
              onSave={formConfig.handleSubmit(handleSave)}
            />
          }
        >
          <SettingsPageContainer>
            <Section.Root>
              <Section.Header
                title={t`Icon and Name`}
                description={t`The name and icon of this field`}
              />
              <SettingsDataModelFieldIconLabelForm
                fieldMetadataItem={fieldMetadataItem}
                maxLength={FIELD_NAME_MAXIMUM_LENGTH}
                isCreationMode={false}
                readonly={readonly}
              />
            </Section.Root>
            {isFormulaField && isFormulaOutputField && (
              <Section.Root>
                <Section.Header
                  title={t`Calculation`}
                  description={t`Compute this field from the record's other fields`}
                />
                <SettingsDataModelFieldFormulaForm
                  objectMetadataItem={objectMetadataItem}
                  expression={formulaDraft ?? savedFormula.expression}
                  onExpressionChange={setFormulaDraft}
                  outputType={fieldMetadataItem.type as FormulaOutputFieldType}
                  targetField={fieldMetadataItem}
                  isPaused={isFormulaPaused}
                  disabled={readonly}
                />
                <StyledSyncActions>
                  <SettingsDataModelFieldFormulaResyncButton
                    fieldMetadataId={fieldMetadataItem.id}
                    disabled={
                      readonly || isFormulaPaused || isDefined(formulaDraft)
                    }
                  />
                </StyledSyncActions>
              </Section.Root>
            )}
            {isSyncField && (
              <Section.Root>
                <Section.Header
                  title={t`Sync`}
                  description={t`Mirror a property of an associated record`}
                />
                <SettingsDataModelFieldSyncForm
                  objectMetadataItem={objectMetadataItem}
                  value={syncFormDraft ?? savedSyncFormValue}
                  onChange={setSyncFormDraft}
                  targetField={fieldMetadataItem}
                  isPaused={isSyncPaused}
                  disabled={readonly}
                />
                <StyledSyncActions>
                  <SettingsDataModelFieldSyncResyncButton
                    fieldMetadataId={fieldMetadataItem.id}
                    disabled={
                      readonly || isSyncPaused || isDefined(syncFormDraft)
                    }
                  />
                </StyledSyncActions>
              </Section.Root>
            )}
            {!isReverseJunctionRelation && !isSyncField && !isFormulaField && (
              <Section.Root>
                {fieldMetadataItem.isUnique ? (
                  <Section.Header
                    title={t`Values`}
                    description={t`The values of this field must be unique`}
                  />
                ) : (
                  <Section.Header
                    title={t`Values`}
                    description={t`The values of this field`}
                  />
                )}
                <SettingsDataModelFieldSettingsFormCard
                  fieldType={fieldMetadataItem.type}
                  existingFieldMetadataId={fieldMetadataItem.id}
                  objectNameSingular={objectMetadataItem.nameSingular}
                  disabled={readonly}
                />
              </Section.Root>
            )}
            <Section.Root>
              <Section.Header
                title={t`Description`}
                description={t`The description of this field`}
              />
              <SettingsDataModelFieldDescriptionForm
                fieldMetadataItem={fieldMetadataItem}
                disabled={readonly}
              />
            </Section.Root>

            <Section.Root>
              <Section.Header
                title={t`Translations`}
                description={t`What each language displays for this field's labels`}
              />
              <SettingsTranslationsCard
                objectNamePlural={objectNamePlural}
                fieldName={fieldMetadataItem.name}
                disabled={isDirty}
              />
            </Section.Root>

            {!isLabelIdentifier && !readonly && fieldCanBeDeactivated && (
              <Section.Root>
                <Section.Header
                  title={t`Danger zone`}
                  description={t`Deactivate this field`}
                />
                <StyledDangerButtons>
                  <Button
                    startIcon={
                      fieldMetadataItem.isActive ? (
                        <IconArchive />
                      ) : (
                        <IconArchiveOff />
                      )
                    }
                    size="sm"
                    onClick={
                      fieldMetadataItem.isActive
                        ? handleDeactivate
                        : handleActivate
                    }
                    variant="outline"
                  >
                    {fieldMetadataItem.isActive ? t`Deactivate` : t`Activate`}
                  </Button>
                  {isCustomField && (
                    <Button
                      startIcon={<IconTrash />}
                      size="sm"
                      onClick={handleDelete}
                      variant="outline"
                      color="danger"
                    >{t`Delete`}</Button>
                  )}
                </StyledDangerButtons>
              </Section.Root>
            )}
          </SettingsPageContainer>
        </SettingsPageLayout>
      </FormProvider>
      {isCustomField && (
        <ConfirmationDialog
          dialogId={DELETE_FIELD_MODAL_ID}
          title={t`Delete ${fieldLabel} field?`}
          subtitle={t`This will permanently delete the field and all its data from ${objectLabel}. Type "yes" to confirm.`}
          confirmButtonText={t`Delete`}
          confirmationValue="yes"
          confirmationPlaceholder="yes"
          onConfirmClick={confirmDelete}
          onClose={() => closeDialog(DELETE_FIELD_MODAL_ID)}
          loading={isDeleting}
        />
      )}
    </>
  );
};
