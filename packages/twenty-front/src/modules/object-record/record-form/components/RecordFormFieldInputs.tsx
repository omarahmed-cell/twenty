import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { formatFieldMetadataItemAsFieldDefinition } from '@/object-metadata/utils/formatFieldMetadataItemAsFieldDefinition';
import { getFieldMetadataItemGqlFieldName } from '@/object-metadata/utils/getFieldMetadataItemGqlFieldName';
import { RecordFormFieldInput } from '@/object-record/record-form/components/RecordFormFieldInput';
import { RecordFormFieldInputsEffect } from '@/object-record/record-form/components/RecordFormFieldInputsEffect';
import { getRecordFormCurrencyFieldDefaultValue } from '@/object-record/record-form/utils/getRecordFormCurrencyFieldDefaultValue';
import { getRecordFormFieldPlaceholders } from '@/object-record/record-form/utils/getRecordFormFieldPlaceholders';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { DealCreationStageDefaultEffect } from '@/pipeline/rules/components/DealCreationStageDefaultEffect';
import { findDealPipeline } from '@/pipeline/rules/utils/applyDealStageRules';
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
import { isDefined } from 'twenty-shared/utils';
import { type JsonValue } from 'type-fest';
import { Field } from 'twenty-ui/primitives/input';
import { themeCssVariables } from 'twenty-ui/theme';

import { usePropertyLogicHiddenFieldNames } from '@/properties/hooks/usePropertyLogicHiddenFieldNames';
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

  const draftPipeline = isDealForm
    ? findDealPipeline({
        pipelines,
        pipelineKey: draftPipelineKey,
        stageValue: null,
      })
    : undefined;

  const draftStageValue = isString(draftRecord[DEAL_STAGE_FIELD_NAME])
    ? draftRecord[DEAL_STAGE_FIELD_NAME]
    : null;

  const propertyLogicHiddenFieldNames = usePropertyLogicHiddenFieldNames({
    objectMetadataItem,
    record: draftRecord,
  });

  const shownFieldMetadataItems = fieldMetadataItems.filter(
    ({ name }) => !propertyLogicHiddenFieldNames.has(name),
  );

  const orderedFieldMetadataItems = isDealForm
    ? movePipelineFieldBeforeStageField(shownFieldMetadataItems)
    : shownFieldMetadataItems;

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
      value={
        isDealForm ? { pipelineKey: draftPipelineKey, isCreate: true } : null
      }
    >
      {isDefined(draftPipeline) && (
        <DealCreationStageDefaultEffect
          pipeline={draftPipeline}
          draftStageValue={draftStageValue}
          onStageChange={(stageValue) =>
            onFieldValueChange(DEAL_STAGE_FIELD_NAME, stageValue)
          }
        />
      )}
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
