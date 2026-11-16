import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { formatFieldMetadataItemAsFieldDefinition } from '@/object-metadata/utils/formatFieldMetadataItemAsFieldDefinition';
import { getFieldMetadataItemGqlFieldName } from '@/object-metadata/utils/getFieldMetadataItemGqlFieldName';
import { RecordFormFieldInput } from '@/object-record/record-form/components/RecordFormFieldInput';
import { RecordFormFieldInputsEffect } from '@/object-record/record-form/components/RecordFormFieldInputsEffect';
import { getRecordFormCurrencyFieldDefaultValue } from '@/object-record/record-form/utils/getRecordFormCurrencyFieldDefaultValue';
import { getRecordFormFieldPlaceholders } from '@/object-record/record-form/utils/getRecordFormFieldPlaceholders';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { useDealStagePipelineConfigs } from '@/pipeline/stage-picker/hooks/useDealStagePipelineConfigs';
import { DealStagePickerContext } from '@/pipeline/stage-picker/contexts/DealStagePickerContext';
import {
  DEAL_PIPELINE_FIELD_NAME,
  DEAL_STAGE_FIELD_NAME,
} from '@/pipeline/stage-picker/utils/dealStageFields';
import {
  getFirstStageValueOfPipeline,
  movePipelineFieldBeforeStageField,
} from '@/pipeline/stage-picker/utils/getStageOptionsForPipeline';
import { type ValidationRuleViolation } from '@/validation-rules/types/ValidationRuleViolation';
import { styled } from '@linaria/react';
import { isString } from '@sniptt/guards';
import { CoreObjectNameSingular } from 'twenty-shared/types';
import { type JsonValue } from 'type-fest';
import { Field } from 'twenty-ui/primitives/input';
import { themeCssVariables } from 'twenty-ui/theme';

const StyledFieldList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
`;

type RecordFormFieldInputsProps = {
  objectMetadataItem: EnrichedObjectMetadataItem;
  fieldMetadataItems: FieldMetadataItem[];
  draftRecord: Partial<ObjectRecord>;
  validationRuleViolationsByFieldMetadataId?: Record<
    string,
    ValidationRuleViolation[]
  >;
  onFieldValueChange: (gqlFieldName: string, value: JsonValue) => void;
  onFieldValueClear: (gqlFieldName: string) => void;
};

export const RecordFormFieldInputs = ({
  objectMetadataItem,
  fieldMetadataItems,
  draftRecord,
  validationRuleViolationsByFieldMetadataId = {},
  onFieldValueChange,
  onFieldValueClear,
}: RecordFormFieldInputsProps) => {
  const isDealForm =
    objectMetadataItem.nameSingular === CoreObjectNameSingular.Opportunity;

  const pipelines = useDealStagePipelineConfigs({ enabled: isDealForm });

  // A deal created without a pipeline lands in the first one, so its stages show until another is picked
  const draftPipelineKey = isString(draftRecord[DEAL_PIPELINE_FIELD_NAME])
    ? draftRecord[DEAL_PIPELINE_FIELD_NAME]
    : pipelines[0]?.key;

  const orderedFieldMetadataItems = isDealForm
    ? movePipelineFieldBeforeStageField(fieldMetadataItems)
    : fieldMetadataItems;

  const handleFieldValueChange = (gqlFieldName: string, value: JsonValue) => {
    onFieldValueChange(gqlFieldName, value);

    if (!isDealForm || gqlFieldName !== DEAL_PIPELINE_FIELD_NAME) {
      return;
    }

    const firstStageValue = getFirstStageValueOfPipeline({
      pipelines,
      pipelineKey: isString(value) ? value : null,
    });

    if (isString(firstStageValue)) {
      onFieldValueChange(DEAL_STAGE_FIELD_NAME, firstStageValue);
    }
  };

  return (
    <DealStagePickerContext.Provider
      value={isDealForm ? { pipelineKey: draftPipelineKey } : null}
    >
      <RecordFormFieldInputsEffect
        fieldMetadataItems={fieldMetadataItems}
        draftRecord={draftRecord}
        onFieldValueChange={onFieldValueChange}
      />
      <StyledFieldList>
        {orderedFieldMetadataItems.map((fieldMetadataItem) => {
          const gqlFieldName =
            getFieldMetadataItemGqlFieldName(fieldMetadataItem);
          const { placeholder, subFieldPlaceholders } =
            getRecordFormFieldPlaceholders(fieldMetadataItem.type);

          return (
            <Field.Root key={fieldMetadataItem.id}>
              <RecordFormFieldInput
                field={formatFieldMetadataItemAsFieldDefinition({
                  field: fieldMetadataItem,
                  objectMetadataItem,
                  showLabel: true,
                })}
                defaultValue={
                  Object.hasOwn(draftRecord, gqlFieldName)
                    ? draftRecord[gqlFieldName]
                    : getRecordFormCurrencyFieldDefaultValue(fieldMetadataItem)
                }
                onChange={(value) =>
                  handleFieldValueChange(gqlFieldName, value)
                }
                onClear={() => onFieldValueClear(gqlFieldName)}
                placeholder={placeholder}
                subFieldPlaceholders={subFieldPlaceholders}
              />
              {(
                validationRuleViolationsByFieldMetadataId[
                  fieldMetadataItem.id
                ] ?? []
              ).map((violation) => (
                <Field.Error key={violation.ruleId} match role="alert">
                  {violation.message}
                </Field.Error>
              ))}
            </Field.Root>
          );
        })}
      </StyledFieldList>
    </DealStagePickerContext.Provider>
  );
};
