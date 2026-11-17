import { useObjectMetadataItem } from '@/object-metadata/hooks/useObjectMetadataItem';
import { formatFieldMetadataItemAsFieldDefinition } from '@/object-metadata/utils/formatFieldMetadataItemAsFieldDefinition';
import { RecordFormFieldInput } from '@/object-record/record-form/components/RecordFormFieldInput';
import { isFieldRelation } from '@/object-record/record-field/ui/types/guards/isFieldRelation';
import { type UpdateMultipleRecordsState } from '@/object-record/record-update-multiple/components/UpdateMultipleRecordsContainer';
import { isUpdateRecordValueEmpty } from '@/object-record/record-update-multiple/utils/isUpdateRecordValueEmpty';
import { shouldDisplayFormMultiEditField } from '@/object-record/record-update-multiple/utils/shouldDisplayFormMultiEditField';
import { useDealStagePipelineConfigs } from '@/pipeline/stage-picker/hooks/useDealStagePipelineConfigs';
import { DealStagePickerContext } from '@/pipeline/stage-picker/contexts/DealStagePickerContext';
import { useDealStageSelectionPipeline } from '@/pipeline/stage-picker/hooks/useDealStageSelectionPipeline';
import {
  DEAL_PIPELINE_FIELD_NAME,
  DEAL_STAGE_FIELD_NAME,
} from '@/pipeline/stage-picker/utils/dealStageFields';
import { getFirstStageValueOfPipeline } from '@/pipeline/stage-picker/utils/getStageOptionsForPipeline';
import { css } from '@linaria/core';
import { t } from '@lingui/core/macro';
import { isString } from '@sniptt/guards';
import { CoreObjectNameSingular, FieldMetadataType } from 'twenty-shared/types';
import {
  computeRelationGqlFieldJoinColumnName,
  isPipelineObjectNameSingular,
} from 'twenty-shared/utils';
import { Section } from 'twenty-ui/components/layout';
import { themeCssVariables } from 'twenty-ui/theme';

const updateMultipleRecordsFormSectionClassName = css`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[6]};
  padding: ${themeCssVariables.spacing[4]} ${themeCssVariables.spacing[3]};
`;

export type UpdateMultipleRecordsFormProps = {
  objectNameSingular: string;
  contextStoreInstanceId: string;
  disabled?: boolean;
  values: UpdateMultipleRecordsState;
  onChange: (fieldName: string, value: any) => void;
};

export const UpdateMultipleRecordsForm = ({
  objectNameSingular,
  contextStoreInstanceId,
  disabled = false,
  values,
  onChange,
}: UpdateMultipleRecordsFormProps) => {
  const { objectMetadataItem } = useObjectMetadataItem({
    objectNameSingular,
  });

  const isDealForm = isPipelineObjectNameSingular(objectNameSingular);

  const pipelines = useDealStagePipelineConfigs({
    enabled: isDealForm,
    objectNameSingular,
  });

  const { result: selectionPipeline } = useDealStageSelectionPipeline({
    objectNameSingular,
    contextStoreInstanceId,
  });

  const chosenPipelineKey = values[DEAL_PIPELINE_FIELD_NAME];

  const dealStagePickerContextValue = !isDealForm
    ? null
    : isString(chosenPipelineKey)
      ? { pipelineKey: chosenPipelineKey }
      : selectionPipeline.status === 'shared'
        ? { pipelineKey: selectionPipeline.pipelineKey }
        : selectionPipeline.status === 'mixed'
          ? {
              pipelineKey: null,
              disabledReason:
                objectNameSingular === CoreObjectNameSingular.Opportunity
                  ? t`Selected deals are in different pipelines`
                  : t`Selected records are in different pipelines`,
            }
          : { pipelineKey: null };

  const editableFields = objectMetadataItem.fields
    .filter(shouldDisplayFormMultiEditField)
    .sort((fieldA, fieldB) => fieldA.name.localeCompare(fieldB.name));

  const fieldsWithDefinitions = editableFields.map((fieldMetadataItem) => ({
    fieldMetadataItem,
    fieldDefinition: formatFieldMetadataItemAsFieldDefinition({
      field: fieldMetadataItem,
      objectMetadataItem,
      showLabel: true,
      labelWidth: 90,
    }),
  }));

  return (
    <DealStagePickerContext.Provider value={dealStagePickerContextValue}>
      <Section.Root
        className={updateMultipleRecordsFormSectionClassName}
        fullWidth={false}
      >
        {fieldsWithDefinitions.map(({ fieldMetadataItem, fieldDefinition }) => {
          const fieldName = fieldDefinition.metadata.fieldName;
          const isRelation = isFieldRelation(fieldDefinition);
          const fieldNameOrRelationIdName =
            isRelation && fieldMetadataItem.type === FieldMetadataType.RELATION
              ? computeRelationGqlFieldJoinColumnName({
                  name: fieldMetadataItem.name,
                })
              : fieldName;

          const value = values[fieldNameOrRelationIdName];

          const handleValueChange = (newValue: any) => {
            if (newValue === null) {
              onChange(fieldNameOrRelationIdName, null);
            } else if (isUpdateRecordValueEmpty(newValue)) {
              onChange(fieldNameOrRelationIdName, undefined);
            } else {
              onChange(fieldNameOrRelationIdName, newValue);
            }

            // A stage picked for another pipeline no longer fits once the pipeline changes
            if (
              isDealForm &&
              fieldNameOrRelationIdName === DEAL_PIPELINE_FIELD_NAME
            ) {
              onChange(
                DEAL_STAGE_FIELD_NAME,
                getFirstStageValueOfPipeline({
                  pipelines,
                  pipelineKey: isString(newValue) ? newValue : null,
                }),
              );
            }
          };

          return (
            <RecordFormFieldInput
              key={fieldDefinition.metadata.fieldName}
              readonly={disabled}
              field={fieldDefinition}
              defaultValue={value}
              onChange={handleValueChange}
              onClear={() => onChange(fieldNameOrRelationIdName, undefined)}
            />
          );
        })}
      </Section.Root>
    </DealStagePickerContext.Provider>
  );
};
