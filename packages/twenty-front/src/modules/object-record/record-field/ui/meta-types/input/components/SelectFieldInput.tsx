import { FieldInputEventContext } from '@/object-record/record-field/ui/contexts/FieldInputEventContext';
import { useClearField } from '@/object-record/record-field/ui/hooks/useClearField';
import { useAddSelectOption } from '@/object-record/record-field/ui/meta-types/hooks/useAddSelectOption';
import { useCanAddSelectOption } from '@/object-record/record-field/ui/meta-types/hooks/useCanAddSelectOption';
import { useFilteredSelectOptionsFromRLSPredicates } from '@/object-record/record-field/ui/meta-types/hooks/useFilteredSelectOptionsFromRLSPredicates';
import { useSelectField } from '@/object-record/record-field/ui/meta-types/hooks/useSelectField';
import { FieldInputDropdown } from '@/object-record/record-field/ui/meta-types/input/components/FieldInputDropdown';
import { recordStoreFamilySelector } from '@/object-record/record-store/states/selectors/recordStoreFamilySelector';
import { useDealStageFieldChange } from '@/pipeline/conditional-logic/hooks/useDealStageFieldChange';
import { useDealStageRuleOptions } from '@/pipeline/rules/hooks/useDealStageRuleOptions';
import { useDealStageOptions } from '@/pipeline/stage-picker/hooks/useDealStageOptions';
import {
  DEAL_PIPELINE_FIELD_NAME,
  isDealPipelineField,
  isDealStageField,
} from '@/pipeline/stage-picker/utils/dealStageFields';
import { SelectInput } from '@/ui/input/components/SelectInput';
import { useAtomFamilySelectorValue } from '@/ui/utilities/state/jotai/hooks/useAtomFamilySelectorValue';
import { isString } from '@sniptt/guards';
import { useContext } from 'react';
import { type SelectOption } from 'twenty-ui/primitives/input';

export const SelectFieldInput = () => {
  const { recordId, fieldDefinition, fieldValue } = useSelectField();
  const { addSelectOption } = useAddSelectOption(
    fieldDefinition.fieldMetadataId,
  );
  const { canAddSelectOption } = useCanAddSelectOption(
    fieldDefinition.fieldMetadataId,
  );

  const { onCancel, onSubmit } = useContext(FieldInputEventContext);

  const { filteredOptions: selectOptions, canSelectEmpty } =
    useFilteredSelectOptionsFromRLSPredicates({
      fieldMetadataId: fieldDefinition.fieldMetadataId,
      objectMetadataNameSingular:
        fieldDefinition.metadata.objectMetadataNameSingular,
      options: fieldDefinition.metadata.options,
    });

  const objectNameSingular =
    fieldDefinition.metadata.objectMetadataNameSingular;

  const isDealStage = isDealStageField({
    objectNameSingular,
    fieldName: fieldDefinition.metadata.fieldName,
  });

  const { isHandledByStageEntry, saveWithStageEntry } = useDealStageFieldChange(
    {
      recordId,
      objectNameSingular,
      isDealStage,
      isDealPipeline: isDealPipelineField({
        objectNameSingular,
        fieldName: fieldDefinition.metadata.fieldName,
      }),
    },
  );

  const dealPipelineKey = useAtomFamilySelectorValue(
    recordStoreFamilySelector,
    { recordId, fieldName: DEAL_PIPELINE_FIELD_NAME },
  );

  const pipelineKey = isString(dealPipelineKey) ? dealPipelineKey : null;
  const currentStageValue = isString(fieldValue) ? fieldValue : null;

  const pipelineSelectOptions = useDealStageOptions({
    isDealStage,
    objectNameSingular,
    options: selectOptions,
    scope: { type: 'pipeline', pipelineKey, currentStageValue },
  });

  const visibleSelectOptions = useDealStageRuleOptions({
    isDealStage,
    objectNameSingular,
    options: pipelineSelectOptions,
    pipelineKey,
    currentStageValue,
    isCreate: false,
  });

  const clearField = useClearField();

  const handleCancel = () => {
    onCancel?.();
  };

  const handleClearField = () => {
    clearField();
    onCancel?.();
  };

  const handleSubmit = (option: SelectOption) => {
    if (isHandledByStageEntry(option.value)) {
      onCancel?.();
      void saveWithStageEntry(option.value);

      return;
    }

    onSubmit?.({ newValue: option.value });
  };

  return (
    <FieldInputDropdown value={fieldValue} onDismiss={handleCancel}>
      <SelectInput
        onOptionSelected={handleSubmit}
        options={visibleSelectOptions}
        value={fieldValue}
        onClear={
          fieldDefinition.metadata.isNullable && canSelectEmpty
            ? handleClearField
            : undefined
        }
        clearLabel={fieldDefinition.label}
        onAddSelectOption={
          canAddSelectOption && !isDealStage ? addSelectOption : undefined
        }
      />
    </FieldInputDropdown>
  );
};
