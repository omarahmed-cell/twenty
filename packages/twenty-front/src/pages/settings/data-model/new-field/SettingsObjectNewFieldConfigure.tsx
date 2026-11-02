import { WorkspaceRouteUnavailable } from '@/ui/layout/page/components/WorkspaceRouteUnavailable';
import { isDDLLockedState } from '@/client-config/states/isDDLLockedState';
import { useFieldMetadataItem } from '@/object-metadata/hooks/useFieldMetadataItem';
import { useFilteredObjectMetadataItems } from '@/object-metadata/hooks/useFilteredObjectMetadataItems';
import { SettingsPageContainer } from '@/settings/components/SettingsPageContainer';
import { SettingsPageLayout } from '@/settings/components/layout/SettingsPageLayout';
import { SettingsWizardStepBar } from '@/settings/components/layout/SettingsWizardStepBar';
import { FIELD_NAME_MAXIMUM_LENGTH } from '@/settings/data-model/constants/FieldNameMaximumLength';
import { SettingsObjectNewFieldHeaderIcon } from '@/settings/data-model/fields/components/SettingsObjectNewFieldHeaderIcon';
import { SettingsDataModelFieldIconLabelForm } from '@/settings/data-model/fields/forms/components/SettingsDataModelFieldIconLabelForm';
import { SettingsDataModelFieldSettingsFormCard } from '@/settings/data-model/fields/forms/components/SettingsDataModelFieldSettingsFormCard';
import { DEFAULT_DECIMAL_VALUE } from '@/localization/utils/formatNumber';
import { SettingsDataModelFieldFormulaForm } from '@/settings/data-model/fields/forms/formula/components/SettingsDataModelFieldFormulaForm';
import {
  getFormulaReferenceableFields,
  validateFormula,
} from '@/settings/data-model/fields/forms/formula/utils/validateFormula';
import {
  SettingsDataModelFieldSyncForm,
  type SettingsDataModelFieldSyncFormValue,
} from '@/settings/data-model/fields/forms/sync/components/SettingsDataModelFieldSyncForm';
import { settingsFieldFormSchema } from '@/settings/data-model/fields/forms/validation-schemas/settingsFieldFormSchema';
import { useWorkspaceSurface } from '@/ui/layout/hooks/useWorkspaceSurface';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLingui } from '@lingui/react/macro';
import { useEffect, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useParams, useSearchParams } from 'react-router-dom';
import {
  AppPath,
  type RelationCreationPayload,
  SettingsPath,
} from 'twenty-shared/types';
import {
  type FormulaOutputFieldType,
  getFieldSyncTargetFieldType,
  getSettingsPath,
  isDefined,
} from 'twenty-shared/utils';
import { v4 } from 'uuid';
import { useToast } from 'twenty-ui/components/feedback';
import { Section } from 'twenty-ui/components/layout';
import { Button } from 'twenty-ui/primitives/input';
import { themeCssVariables } from 'twenty-ui/theme';
import { type z } from 'zod';
import { FieldMetadataType, RelationType } from '~/generated-metadata/graphql';
import { useNavigateApp } from '~/hooks/useNavigateApp';
import { useNavigateSettings } from '~/hooks/useNavigateSettings';
import { DEFAULT_ICONS_BY_FIELD_TYPE } from '~/pages/settings/data-model/constants/DefaultIconsByFieldType';

type SettingsDataModelNewFieldFormValues = z.infer<
  ReturnType<typeof settingsFieldFormSchema>
> &
  any;

const DEFAULT_ICON_FOR_NEW_FIELD = 'IconUsers';

const SYNC_FIELD_DEFAULT_ICON = 'IconRefresh';
const FORMULA_FIELD_DEFAULT_ICON = 'IconCalculator';

export const SettingsObjectNewFieldConfigure = () => {
  const { t } = useLingui();

  const navigateApp = useNavigateApp();
  const navigate = useNavigateSettings();
  const workspaceSurface = useWorkspaceSurface();

  const { objectNamePlural = '' } = useParams();
  const [searchParams] = useSearchParams();
  const fieldType =
    (searchParams.get('fieldType') as FieldMetadataType) ||
    FieldMetadataType.TEXT;
  const isSyncMode = searchParams.get('sync') === 'true';
  const isFormulaMode = searchParams.get('formula') === 'true';
  const { enqueueToast } = useToast();

  const { findObjectMetadataItemByNamePlural } =
    useFilteredObjectMetadataItems();
  const activeObjectMetadataItem =
    findObjectMetadataItemByNamePlural(objectNamePlural);
  const { createMetadataField } = useFieldMetadataItem();

  const formConfig = useForm<SettingsDataModelNewFieldFormValues>({
    mode: 'onTouched',
    resolver: zodResolver(
      settingsFieldFormSchema({
        existingOtherLabels: activeObjectMetadataItem?.fields.map(
          (value) => value.name,
        ),
        sourceObjectMetadataId: activeObjectMetadataItem?.id,
      }),
    ),
    defaultValues: {
      type: fieldType,
      icon: isFormulaMode
        ? FORMULA_FIELD_DEFAULT_ICON
        : isSyncMode
          ? SYNC_FIELD_DEFAULT_ICON
          : (DEFAULT_ICONS_BY_FIELD_TYPE[fieldType] ??
            DEFAULT_ICON_FOR_NEW_FIELD),
      label: '',
      name: '',
      // The text settings card that normally fills this is not rendered for synced fields.
      ...(isSyncMode ? { settings: { displayedMaxRows: null } } : {}),
      ...(isFormulaMode
        ? {
            type: FieldMetadataType.NUMBER,
            defaultValue: null,
            settings: { type: 'number', decimals: DEFAULT_DECIMAL_VALUE },
          }
        : {}),
    },
  });

  useEffect(() => {
    formConfig.setValue(
      'icon',
      isFormulaMode
        ? FORMULA_FIELD_DEFAULT_ICON
        : isSyncMode
          ? SYNC_FIELD_DEFAULT_ICON
          : (DEFAULT_ICONS_BY_FIELD_TYPE[fieldType] ??
            DEFAULT_ICON_FOR_NEW_FIELD),
    );
  }, [fieldType, formConfig, isFormulaMode, isSyncMode]);

  const [isSaving, setIsSaving] = useState(false);

  const [syncFormValue, setSyncFormValue] =
    useState<SettingsDataModelFieldSyncFormValue>({});

  const [formulaExpression, setFormulaExpression] = useState('');
  const [formulaOutputType, setFormulaOutputType] =
    useState<FormulaOutputFieldType>(FieldMetadataType.NUMBER);

  // These cards are not rendered for calculated fields, so the form defaults stand in for them.
  const handleFormulaOutputTypeChange = (
    outputType: FormulaOutputFieldType,
  ) => {
    setFormulaOutputType(outputType);
    formConfig.setValue('type', outputType as never, { shouldValidate: true });
    formConfig.setValue(
      'defaultValue',
      (outputType === FieldMetadataType.BOOLEAN ? false : null) as never,
      { shouldValidate: true },
    );
    formConfig.setValue(
      'settings',
      (outputType === FieldMetadataType.NUMBER
        ? { type: 'number', decimals: DEFAULT_DECIMAL_VALUE }
        : { displayedMaxRows: null }) as never,
      { shouldValidate: true },
    );
  };

  useEffect(() => {
    if (
      workspaceSurface.type === 'main' &&
      !isDefined(activeObjectMetadataItem)
    ) {
      navigateApp(AppPath.NotFound);
    }
  }, [activeObjectMetadataItem, navigateApp, workspaceSurface.type]);

  const isDDLLocked = useAtomStateValue(isDDLLockedState);

  if (!isDefined(activeObjectMetadataItem)) {
    return workspaceSurface.type === 'side-panel' ? (
      <WorkspaceRouteUnavailable />
    ) : null;
  }

  const { isValid, isSubmitting } = formConfig.formState;

  const canSave =
    isValid &&
    !isSubmitting &&
    !isDDLLocked &&
    (!isSyncMode || isDefined(syncFormValue.sourceField)) &&
    (!isFormulaMode ||
      validateFormula(
        formulaExpression,
        getFormulaReferenceableFields(activeObjectMetadataItem),
      ).status === 'valid');

  const handleSave = async (
    formValues: SettingsDataModelNewFieldFormValues,
  ) => {
    setIsSaving(true);

    const createCleanUp = (
      creationResult: Awaited<ReturnType<typeof createMetadataField>>,
    ) => {
      if (creationResult.status === 'successful') {
        navigate(SettingsPath.ObjectDetail, {
          objectNamePlural,
        });
      }
      setIsSaving(false);
    };

    const syncSourceField = syncFormValue.sourceField;
    const syncRelationField = activeObjectMetadataItem.fields.find(
      (field) => field.id === syncFormValue.relationFieldMetadataId,
    );
    const syncTargetFieldType = isDefined(syncSourceField)
      ? getFieldSyncTargetFieldType(syncSourceField.type)
      : undefined;

    if (
      isSyncMode &&
      isDefined(syncSourceField) &&
      isDefined(syncTargetFieldType) &&
      isDefined(syncFormValue.relationFieldMetadataId)
    ) {
      const creationResult = await createMetadataField({
        ...formValues,
        type: syncTargetFieldType,
        defaultValue: null,
        isUnique: false,
        isUIEditable: false,
        options:
          syncTargetFieldType === FieldMetadataType.TEXT
            ? undefined
            : (syncSourceField.options ?? []).map(
                ({ label, value, color, position }) => ({
                  id: v4(),
                  label,
                  value,
                  color,
                  position,
                }),
              ),
        settings: {
          sync: {
            relationFieldMetadataId: syncFormValue.relationFieldMetadataId,
            sourceFieldMetadataId: syncSourceField.id,
            ...(syncRelationField?.relation?.type === RelationType.ONE_TO_MANY
              ? { policy: syncFormValue.policy ?? 'MOST_RECENTLY_CREATED' }
              : {}),
          },
        },
        objectMetadataId: activeObjectMetadataItem.id,
      });

      return createCleanUp(creationResult);
    }

    if (isFormulaMode) {
      const creationResult = await createMetadataField({
        ...formValues,
        type: formulaOutputType,
        defaultValue: null,
        isUnique: false,
        isUIEditable: false,
        settings: {
          ...(formulaOutputType === FieldMetadataType.NUMBER
            ? formValues.settings
            : {}),
          formula: { expression: formulaExpression },
        },
        objectMetadataId: activeObjectMetadataItem.id,
      });

      return createCleanUp(creationResult);
    }

    if (formValues.type !== FieldMetadataType.MORPH_RELATION) {
      const creationResult = await createMetadataField({
        ...formValues,
        objectMetadataId: activeObjectMetadataItem.id,
      });

      return createCleanUp(creationResult);
    }

    const {
      morphRelationObjectMetadataIds,
      targetFieldLabel,
      iconOnDestination,
      relationType,
    } = formValues;

    switch (true) {
      case morphRelationObjectMetadataIds.length > 1: {
        const creationResult = await createMetadataField({
          ...formValues,
          type: FieldMetadataType.MORPH_RELATION,
          objectMetadataId: activeObjectMetadataItem.id,
          isLabelSyncedWithName: false,
          morphRelationsCreationPayload: morphRelationObjectMetadataIds.map(
            (morphRelationObjectMetadataId: string) => ({
              type: relationType,
              targetObjectMetadataId: morphRelationObjectMetadataId,
              targetFieldLabel,
              targetFieldIcon: iconOnDestination,
            }),
          ),
        });
        return createCleanUp(creationResult);
      }
      case morphRelationObjectMetadataIds.length === 1: {
        const relationCreationPayload = {
          type: relationType,
          targetObjectMetadataId: morphRelationObjectMetadataIds[0],
          targetFieldLabel,
          targetFieldIcon: iconOnDestination,
        } satisfies RelationCreationPayload;

        const creationResult = await createMetadataField({
          ...formValues,
          type: FieldMetadataType.RELATION,
          objectMetadataId: activeObjectMetadataItem.id,
          relationCreationPayload,
        });

        return createCleanUp(creationResult);
      }
      default: {
        enqueueToast({
          status: 'error',
          children: t`Please select at least one destination object for this relation.`,
        });
        return setIsSaving(false);
      }
    }
  };

  return (
    <FormProvider // oxlint-disable-next-line react/jsx-props-no-spreading
      {...formConfig}
    >
      <SettingsPageLayout
        title={activeObjectMetadataItem.labelPlural}
        icon={
          <SettingsObjectNewFieldHeaderIcon
            objectMetadataItem={activeObjectMetadataItem}
          />
        }
        titleColor={themeCssVariables.font.color.tertiary}
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
            children: activeObjectMetadataItem.labelPlural,
            href: getSettingsPath(SettingsPath.ObjectDetail, {
              objectNamePlural,
            }),
          },
          { children: t`New field` },
        ]}
        secondaryBar={
          <SettingsWizardStepBar
            label={t`2. Configure field`}
            onBack={() =>
              navigate(
                SettingsPath.ObjectNewFieldSelect,
                { objectNamePlural },
                { fieldType },
              )
            }
            trailing={
              <Button
                size="sm"
                onClick={formConfig.handleSubmit(handleSave)}
                disabled={!canSave || isSaving}
                variant="solid"
                color="accent"
              >{t`Save`}</Button>
            }
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
              maxLength={FIELD_NAME_MAXIMUM_LENGTH}
              isCreationMode={true}
            />
          </Section.Root>
          {isFormulaMode ? (
            <Section.Root>
              <Section.Header
                title={t`Calculation`}
                description={t`Compute this field from the record's other fields`}
              />
              <SettingsDataModelFieldFormulaForm
                objectMetadataItem={activeObjectMetadataItem}
                expression={formulaExpression}
                onExpressionChange={setFormulaExpression}
                outputType={formulaOutputType}
                onOutputTypeChange={handleFormulaOutputTypeChange}
              />
            </Section.Root>
          ) : isSyncMode ? (
            <Section.Root>
              <Section.Header
                title={t`Sync`}
                description={t`Mirror a property of an associated record`}
              />
              <SettingsDataModelFieldSyncForm
                objectMetadataItem={activeObjectMetadataItem}
                value={syncFormValue}
                onChange={setSyncFormValue}
              />
            </Section.Root>
          ) : (
            <Section.Root>
              <Section.Header
                title={t`Customization`}
                description={t`Customize field settings`}
              />
              <SettingsDataModelFieldSettingsFormCard
                fieldType={fieldType}
                existingFieldMetadataId=""
                objectNameSingular={activeObjectMetadataItem.nameSingular}
              />
            </Section.Root>
          )}
        </SettingsPageContainer>
      </SettingsPageLayout>
    </FormProvider>
  );
};
