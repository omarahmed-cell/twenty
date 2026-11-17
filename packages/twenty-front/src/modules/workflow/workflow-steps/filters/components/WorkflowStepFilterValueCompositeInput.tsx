import { getActorSourceSelectOptions } from '@/object-record/object-filter-dropdown/utils/getActorSourceSelectOptions';
import { FormCountryMultiSelectInput } from '@/object-record/record-field/ui/form-types/components/FormCountryMultiSelectInput';
import { FormMultiSelectFieldInput } from '@/object-record/record-field/ui/form-types/components/FormMultiSelectFieldInput';
import { FormNumberFieldInput } from '@/object-record/record-field/ui/form-types/components/FormNumberFieldInput';
import { FormRelationToOneFieldInput } from '@/object-record/record-field/ui/form-types/components/FormRelationToOneFieldInput';
import { FormTextFieldInput } from '@/object-record/record-field/ui/form-types/components/FormTextFieldInput';
import {
  type FieldRelationToOneValue,
  type FieldRelationValue,
} from '@/object-record/record-field/ui/types/FieldMetadata';
import { useCurrencies } from '@/ui/input/components/internal/hooks/useCurrencies';
import { WorkflowStepFilterContext } from '@/workflow/workflow-steps/filters/states/context/WorkflowStepFilterContext';
import { WorkflowVariablePicker } from '@/workflow/workflow-variables/components/WorkflowVariablePicker';
import { useContext } from 'react';
import { CoreObjectNameSingular, type StepFilter } from 'twenty-shared/types';
import { type JsonValue } from 'type-fest';

export const WorkflowStepFilterValueCompositeInput = ({
  stepFilter,
  onChange,
  onClear,
}: {
  stepFilter: StepFilter;
  onChange: (newValue: JsonValue) => void;
  onClear: () => void;
}) => {
  const { readonly } = useContext(WorkflowStepFilterContext);
  const currencies = useCurrencies();
  const { type: filterType, compositeFieldSubFieldName: subFieldName } =
    stepFilter;

  return (
    <>
      {filterType === 'ADDRESS' ? (
        subFieldName === 'addressCountry' ? (
          <FormCountryMultiSelectInput
            defaultValue={stepFilter.value}
            onChange={onChange}
            VariablePicker={WorkflowVariablePicker}
            readonly={readonly}
          />
        ) : (
          <FormTextFieldInput
            defaultValue={stepFilter.value}
            onChange={onChange}
            VariablePicker={WorkflowVariablePicker}
            readonly={readonly}
          />
        )
      ) : filterType === 'CURRENCY' ? (
        subFieldName === 'currencyCode' ? (
          <FormMultiSelectFieldInput
            defaultValue={stepFilter.value}
            onChange={onChange}
            VariablePicker={WorkflowVariablePicker}
            options={currencies}
            readonly={readonly}
          />
        ) : subFieldName === 'amountMicros' ? (
          <FormNumberFieldInput
            defaultValue={stepFilter.value}
            onChange={onChange}
            VariablePicker={WorkflowVariablePicker}
            readonly={readonly}
          />
        ) : null
      ) : filterType === 'PHONES' ? (
        subFieldName === 'primaryPhoneNumber' ? (
          <FormNumberFieldInput
            defaultValue={stepFilter.value}
            onChange={onChange}
            VariablePicker={WorkflowVariablePicker}
            readonly={readonly}
          />
        ) : (
          <FormTextFieldInput
            defaultValue={stepFilter.value}
            onChange={onChange}
            VariablePicker={WorkflowVariablePicker}
            readonly={readonly}
          />
        )
      ) : filterType === 'ACTOR' ? (
        subFieldName === 'source' ? (
          <FormMultiSelectFieldInput
            defaultValue={stepFilter.value}
            onChange={onChange}
            options={getActorSourceSelectOptions()}
            readonly={readonly}
            VariablePicker={WorkflowVariablePicker}
          />
        ) : subFieldName === 'workspaceMemberId' ? (
          <FormRelationToOneFieldInput
            objectNameSingular={CoreObjectNameSingular.WorkspaceMember}
            defaultValue={
              stepFilter.value as
                | FieldRelationValue<FieldRelationToOneValue>
                | string
            }
            onChange={onChange}
            onClear={onClear}
            VariablePicker={WorkflowVariablePicker}
            readonly={readonly}
          />
        ) : (
          <FormTextFieldInput
            defaultValue={stepFilter.value}
            onChange={onChange}
            VariablePicker={WorkflowVariablePicker}
            readonly={readonly}
          />
        )
      ) : (
        <FormTextFieldInput
          defaultValue={stepFilter.value}
          onChange={onChange}
          VariablePicker={WorkflowVariablePicker}
          readonly={readonly}
        />
      )}
    </>
  );
};
