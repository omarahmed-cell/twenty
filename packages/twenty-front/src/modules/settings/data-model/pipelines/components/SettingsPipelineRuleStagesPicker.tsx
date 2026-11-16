import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { Dropdown } from 'twenty-ui/components/navigation';

import { type PipelineStageConfig } from '@/pipeline/types/PipelineConfig';
import { SelectControl } from '@/ui/input/components/SelectControl';
import { DropdownContent } from '@/ui/layout/dropdown/components/DropdownContent';
import { DropdownRoot } from '@/ui/layout/dropdown/components/DropdownRoot';
import { GenericDropdownContentWidth } from '@/ui/layout/dropdown/constants/GenericDropdownContentWidth';

type SettingsPipelineRuleStagesPickerProps = {
  dropdownId: string;
  stages: PipelineStageConfig[];
  selectedStageValues: string[];
  isDisabled: boolean;
  onToggleStage: (stageValue: string) => void;
};

export const SettingsPipelineRuleStagesPicker = ({
  dropdownId,
  stages,
  selectedStageValues,
  isDisabled,
  onToggleStage,
}: SettingsPipelineRuleStagesPickerProps) => {
  const { t } = useLingui();

  const selectedStages = stages.filter((stage) =>
    selectedStageValues.includes(stage.value),
  );

  const controlLabel =
    selectedStages.length === 0
      ? t`Choose stages`
      : selectedStages.length === 1
        ? selectedStages[0].label
        : plural(selectedStages.length, {
            one: '# stage',
            other: '# stages',
          });

  const selectControl = (
    <SelectControl
      isDisabled={isDisabled}
      selectedOption={{ label: controlLabel, value: controlLabel }}
    />
  );

  if (isDisabled) {
    return selectControl;
  }

  return (
    <DropdownRoot dropdownId={dropdownId} type="picker">
      <Dropdown.Trigger
        render={<div />}
        nativeButton={false}
        aria-label={t`Stages`}
      >
        {selectControl}
      </Dropdown.Trigger>
      <DropdownContent align="start" width={GenericDropdownContentWidth.Large}>
        <Dropdown.Section scrollable>
          {stages.map((stage) => (
            <Dropdown.OptionItem
              key={stage.id}
              indicator="checkbox"
              closeOnSelect={false}
              selected={selectedStageValues.includes(stage.value)}
              onSelect={() => onToggleStage(stage.value)}
            >
              {stage.label}
            </Dropdown.OptionItem>
          ))}
        </Dropdown.Section>
      </DropdownContent>
    </DropdownRoot>
  );
};
