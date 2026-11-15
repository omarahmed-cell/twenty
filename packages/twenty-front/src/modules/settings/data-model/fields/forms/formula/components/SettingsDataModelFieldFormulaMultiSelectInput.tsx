import { SelectControl } from '@/ui/input/components/SelectControl';
import { DropdownContent } from '@/ui/layout/dropdown/components/DropdownContent';
import { DropdownRoot } from '@/ui/layout/dropdown/components/DropdownRoot';
import { GenericDropdownContentWidth } from '@/ui/layout/dropdown/constants/GenericDropdownContentWidth';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { Dropdown } from 'twenty-ui/components/navigation';
import { themeCssVariables } from 'twenty-ui/theme';

const StyledLabel = styled.span`
  color: ${themeCssVariables.font.color.light};
  display: block;
  font-size: ${themeCssVariables.font.size.xs};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  margin-bottom: ${themeCssVariables.spacing[1]};
`;

type SettingsDataModelFieldFormulaMultiSelectInputProps = {
  dropdownId: string;
  label: string;
  options: { value: string; label: string }[];
  value: string[];
  onChange: (value: string[]) => void;
};

export const SettingsDataModelFieldFormulaMultiSelectInput = ({
  dropdownId,
  label,
  options,
  value,
  onChange,
}: SettingsDataModelFieldFormulaMultiSelectInputProps) => {
  const { t } = useLingui();

  const selectedLabels = options
    .filter((option) => value.includes(option.value))
    .map((option) => option.label);

  return (
    <div>
      <StyledLabel>{label}</StyledLabel>
      <DropdownRoot dropdownId={dropdownId} type="picker" multiple>
        <Dropdown.Trigger render={<div />} nativeButton={false}>
          <SelectControl
            selectedOption={{
              label:
                selectedLabels.length > 0
                  ? selectedLabels.join(', ')
                  : t`Empty`,
              value: '',
            }}
            textAccent={selectedLabels.length > 0 ? 'default' : 'placeholder'}
          />
        </Dropdown.Trigger>
        <DropdownContent
          width={GenericDropdownContentWidth.Medium}
          align="start"
          aria-label={label}
        >
          <Dropdown.SelectionGroup
            aria-label={label}
            multiple
            value={value}
            onValueChange={onChange}
          >
            <Dropdown.Section scrollable>
              {options.map((option) => (
                <Dropdown.OptionItem
                  key={option.value}
                  value={option.value}
                  indicator="checkbox"
                >
                  {option.label}
                </Dropdown.OptionItem>
              ))}
            </Dropdown.Section>
          </Dropdown.SelectionGroup>
        </DropdownContent>
      </DropdownRoot>
    </div>
  );
};
