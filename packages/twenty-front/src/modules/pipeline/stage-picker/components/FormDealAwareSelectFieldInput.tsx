import { useContext } from 'react';

import { FormSelectFieldInput } from '@/object-record/record-field/ui/form-types/components/FormSelectFieldInput';
import { DealStagePickerContext } from '@/pipeline/stage-picker/contexts/DealStagePickerContext';
import { useDealStageOptions } from '@/pipeline/stage-picker/hooks/useDealStageOptions';
import { type VariablePickerComponent } from '@/ui/input/types/VariablePickerComponent';
import { isDefined } from 'twenty-shared/utils';
import { type SelectOption } from 'twenty-ui/primitives/input';

type FormDealAwareSelectFieldInputProps = {
  isDealStage: boolean;
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
  label,
  defaultValue,
  onChange,
  VariablePicker,
  options,
  readonly,
  isNullable,
}: FormDealAwareSelectFieldInputProps) => {
  const dealStagePickerContext = useContext(DealStagePickerContext);

  const visibleOptions = useDealStageOptions({
    isDealStage,
    options,
    scope: isDefined(dealStagePickerContext)
      ? { type: 'pipeline', pipelineKey: dealStagePickerContext.pipelineKey }
      : { type: 'all' },
  });

  const disabledReason = isDealStage
    ? dealStagePickerContext?.disabledReason
    : undefined;

  return (
    <FormSelectFieldInput
      key={
        isDealStage ? (dealStagePickerContext?.pipelineKey ?? 'all') : undefined
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
