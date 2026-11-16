import { FieldInputEventContext } from '@/object-record/record-field/ui/contexts/FieldInputEventContext';
import { useClearField } from '@/object-record/record-field/ui/hooks/useClearField';
import { useAddSelectOption } from '@/object-record/record-field/ui/meta-types/hooks/useAddSelectOption';
import { useCanAddSelectOption } from '@/object-record/record-field/ui/meta-types/hooks/useCanAddSelectOption';
import { useFilteredSelectOptionsFromRLSPredicates } from '@/object-record/record-field/ui/meta-types/hooks/useFilteredSelectOptionsFromRLSPredicates';
import { useSelectField } from '@/object-record/record-field/ui/meta-types/hooks/useSelectField';
import { FieldInputDropdown } from '@/object-record/record-field/ui/meta-types/input/components/FieldInputDropdown';
import { recordStoreFamilySelector } from '@/object-record/record-store/states/selectors/recordStoreFamilySelector';
import { useDealStageOptions } from '@/pipeline/stage-picker/hooks/useDealStageOptions';
import {
  DEAL_PIPELINE_FIELD_NAME,
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

  const isDealStage = isDealStageField({
    objectNameSingular: fieldDefinition.metadata.objectMetadataNameSingular,
    fieldName: fieldDefinition.metadata.fieldName,
  });

  const dealPipelineKey = useAtomFamilySelectorValue(
    recordStoreFamilySelector,
    { recordId, fieldName: DEAL_PIPELINE_FIELD_NAME },
  );

  const visibleSelectOptions = useDealStageOptions({
    isDealStage,
    options: selectOptions,
    scope: {
      type: 'pipeline',
      pipelineKey: isString(dealPipelineKey) ? dealPipelineKey : null,
      currentStageValue: isString(fieldValue) ? fieldValue : null,
    },
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
