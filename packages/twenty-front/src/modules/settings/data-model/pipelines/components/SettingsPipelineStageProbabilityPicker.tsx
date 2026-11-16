import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { isDefined } from 'twenty-shared/utils';
import { Dropdown } from 'twenty-ui/components/navigation';
import { themeCssVariables } from 'twenty-ui/theme';

import { formatPipelineStageProbability } from '@/settings/data-model/pipelines/utils/formatPipelineStageProbability';
import { parsePipelineStageProbabilityInput } from '@/settings/data-model/pipelines/utils/parsePipelineStageProbabilityInput';
import { SelectControl } from '@/ui/input/components/SelectControl';
import { SettingsTextInput } from '@/ui/input/components/SettingsTextInput';
import { DropdownContent } from '@/ui/layout/dropdown/components/DropdownContent';
import { DropdownRoot } from '@/ui/layout/dropdown/components/DropdownRoot';
import { GenericDropdownContentWidth } from '@/ui/layout/dropdown/constants/GenericDropdownContentWidth';

const PROBABILITY_PRESETS = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

const StyledCustomInputContainer = styled.div`
  padding: ${themeCssVariables.spacing[1]};
`;

type SettingsPipelineStageProbabilityPickerProps = {
  stageId: string;
  probability: number | null;
  onChange: (probability: number | null) => void;
};

export const SettingsPipelineStageProbabilityPicker = ({
  stageId,
  probability,
  onChange,
}: SettingsPipelineStageProbabilityPickerProps) => {
  const { t } = useLingui();
  const [customInput, setCustomInput] = useState('');
  const [customInputError, setCustomInputError] = useState<string>();

  const handleCustomInputEnter = () => {
    const parsed = parsePipelineStageProbabilityInput(customInput);

    if (!parsed.isValid) {
      setCustomInputError(t`Enter a whole number from 0 to 100`);

      return;
    }

    setCustomInputError(undefined);
    setCustomInput('');
    onChange(parsed.probability);
  };

  return (
    <DropdownRoot
      dropdownId={`settings-pipeline-stage-probability-${stageId}`}
      type="picker"
    >
      <Dropdown.Trigger
        render={<div />}
        nativeButton={false}
        aria-label={t`Probability`}
      >
        <SelectControl
          selectSizeVariant="small"
          selectedOption={{
            label: formatPipelineStageProbability(probability),
            value: probability,
          }}
        />
      </Dropdown.Trigger>
      <DropdownContent align="start" width={GenericDropdownContentWidth.Medium}>
        <StyledCustomInputContainer>
          <SettingsTextInput
            instanceId={`settings-pipeline-stage-probability-input-${stageId}`}
            placeholder={t`Custom %, 0 to 100`}
            value={customInput}
            onChange={(value) => {
              setCustomInput(value);
              setCustomInputError(undefined);
            }}
            onInputEnter={handleCustomInputEnter}
            error={customInputError}
            fullWidth
          />
        </StyledCustomInputContainer>
        <Dropdown.Separator />
        <Dropdown.Section scrollable>
          <Dropdown.OptionItem
            selected={!isDefined(probability)}
            onSelect={() => onChange(null)}
          >
            {formatPipelineStageProbability(null)}
          </Dropdown.OptionItem>
          {PROBABILITY_PRESETS.map((preset) => (
            <Dropdown.OptionItem
              key={preset}
              selected={preset === probability}
              onSelect={() => onChange(preset)}
            >
              {formatPipelineStageProbability(preset)}
            </Dropdown.OptionItem>
          ))}
        </Dropdown.Section>
      </DropdownContent>
    </DropdownRoot>
  );
};
