import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { Dropdown } from 'twenty-ui/components/navigation';
import { ColorSample } from 'twenty-ui/primitives/data-display';
import { MAIN_COLOR_NAMES, type ThemeColor } from 'twenty-ui/theme';

import { useColorLabels } from '@/ui/input/hooks/useColorLabels';
import { DropdownContent } from '@/ui/layout/dropdown/components/DropdownContent';
import { DropdownRoot } from '@/ui/layout/dropdown/components/DropdownRoot';

const StyledColorSampleContainer = styled.span`
  align-items: center;
  cursor: pointer;
  display: flex;
`;

const DEFAULT_STAGE_COLOR: ThemeColor = 'gray';

type SettingsPipelineStageColorPickerProps = {
  stageId: string;
  color: string | null;
  onChange: (color: ThemeColor) => void;
};

export const SettingsPipelineStageColorPicker = ({
  stageId,
  color,
  onChange,
}: SettingsPipelineStageColorPickerProps) => {
  const { t } = useLingui();
  const colorLabels = useColorLabels();
  const selectedColor =
    MAIN_COLOR_NAMES.find((colorName) => colorName === color) ??
    DEFAULT_STAGE_COLOR;

  return (
    <DropdownRoot
      dropdownId={`settings-pipeline-stage-color-${stageId}`}
      type="picker"
    >
      <Dropdown.Trigger
        render={<StyledColorSampleContainer />}
        nativeButton={false}
        aria-label={t`Color`}
      >
        <ColorSample colorName={selectedColor} />
      </Dropdown.Trigger>
      <DropdownContent align="start">
        <Dropdown.Section>
          {MAIN_COLOR_NAMES.map((colorName) => (
            <Dropdown.OptionItem
              key={colorName}
              selected={colorName === selectedColor}
              onSelect={() => onChange(colorName)}
              startIcon={<ColorSample colorName={colorName} />}
            >
              {colorLabels[colorName]}
            </Dropdown.OptionItem>
          ))}
        </Dropdown.Section>
      </DropdownContent>
    </DropdownRoot>
  );
};
