import { useContext } from 'react';

import { FormSelectFieldInput } from '@/object-record/record-field/ui/form-types/components/FormSelectFieldInput';
import { useDealStageRuleOptions } from '@/pipeline/rules/hooks/useDealStageRuleOptions';
import { DealStagePickerContext } from '@/pipeline/stage-picker/contexts/DealStagePickerContext';
import { useDealStageOptions } from '@/pipeline/stage-picker/hooks/useDealStageOptions';
import { type VariablePickerComponent } from '@/ui/input/types/VariablePickerComponent';
import { isDefined } from 'twenty-shared/utils';
import { type SelectOption } from 'twenty-ui/primitives/input';

type FormDealAwareSelectFieldInputProps = {
  isDealStage: boolean;
  objectNameSingular?: string;
  label?: string;
  defaultValue: string | undefined;
  onChange: (value: string | null) => void;
  VariablePicker?: VariablePickerComponent;
  options: SelectOption[];
  readonly?: boolean;
  isNullable?: boolean;
};

// A deal form scopes the stage to its pipeline; workflows and other forms get every stage under its pipeline name
export const FormDealAwareSelectFieldInput = ({
  isDealStage,
  objectNameSingular,
  label,
  defaultValue,
  onChange,
  VariablePicker,
  options,
  readonly,
  isNullable,
}: FormDealAwareSelectFieldInputProps) => {
  const dealStagePickerContext = useContext(DealStagePickerContext);

  const pipelineOptions = useDealStageOptions({
    isDealStage,
    objectNameSingular,
    options,
    scope: isDefined(dealStagePickerContext)
      ? { type: 'pipeline', pipelineKey: dealStagePickerContext.pipelineKey }
      : { type: 'all' },
  });

  const visibleOptions = useDealStageRuleOptions({
    isDealStage: isDealStage && dealStagePickerContext?.isCreate === true,
    objectNameSingular,
    options: pipelineOptions,
    pipelineKey: dealStagePickerContext?.pipelineKey,
    currentStageValue: null,
    isCreate: true,
  });

  const isDefaultValueSelectable = visibleOptions.some(
    (option) => option.value === defaultValue && option.disabled !== true,
  );

  const disabledReason = isDealStage
    ? dealStagePickerContext?.disabledReason
    : undefined;

  return (
    <FormSelectFieldInput
      // Remounts when the form swaps a refused default stage for an allowed one
      key={
        isDealStage
          ? `${dealStagePickerContext?.pipelineKey ?? 'all'}-${isDefaultValueSelectable}`
          : undefined
      }
      label={label}
      hint={disabledReason}
      defaultValue={defaultValue}
      onChange={onChange}
      VariablePicker={VariablePicker}
      options={visibleOptions}
      readonly={readonly === true || isDefined(disabledReason)}
      isNullable={isNullable}
    />
  );
};
