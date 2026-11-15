import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { SelectControl } from '@/ui/input/components/SelectControl';
import { DropdownContent } from '@/ui/layout/dropdown/components/DropdownContent';
import { DropdownRoot } from '@/ui/layout/dropdown/components/DropdownRoot';
import { GenericDropdownContentWidth } from '@/ui/layout/dropdown/constants/GenericDropdownContentWidth';
import { normalizeSearchText } from 'twenty-ui/utilities';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { isDefined } from 'twenty-shared/utils';
import { Dropdown } from 'twenty-ui/components/navigation';
import { IconChevronLeft } from 'twenty-ui/icon';

const FIELDS_PAGE_ID = 'select-fields';

const getFieldPageId = (fieldId: string) => `select-field-${fieldId}`;

type SettingsDataModelFieldFormulaSelectValuesMenuProps = {
  selectFields: FieldMetadataItem[];
  defaultFieldId?: string;
  onInsert: (text: string) => void;
  disabled?: boolean;
};

export const SettingsDataModelFieldFormulaSelectValuesMenu = ({
  selectFields,
  defaultFieldId,
  onInsert,
  disabled = false,
}: SettingsDataModelFieldFormulaSelectValuesMenuProps) => {
  const { t } = useLingui();
  const [searchInputValue, setSearchInputValue] = useState('');

  const control = (
    <SelectControl
      selectedOption={{ label: t`Select values`, value: '' }}
      textAccent="placeholder"
      isDisabled={disabled || selectFields.length === 0}
    />
  );

  if (disabled || selectFields.length === 0) {
    return control;
  }

  const defaultField = selectFields.find(({ id }) => id === defaultFieldId);
  const normalizedSearchInputValue = normalizeSearchText(searchInputValue);

  return (
    <DropdownRoot
      dropdownId="field-formula-insert-option-value"
      type="menu"
      defaultPage={
        isDefined(defaultField)
          ? getFieldPageId(defaultField.id)
          : FIELDS_PAGE_ID
      }
      onOpenChange={() => setSearchInputValue('')}
    >
      <Dropdown.Trigger render={<div />} nativeButton={false}>
        {control}
      </Dropdown.Trigger>
      <DropdownContent
        width={GenericDropdownContentWidth.Medium}
        align="start"
        aria-label={t`Select values`}
      >
        <Dropdown.Page id={FIELDS_PAGE_ID} type="menu">
          <Dropdown.Section scrollable>
            {selectFields.map(({ id, label, name }) => (
              <Dropdown.ActionItem
                key={id}
                page={getFieldPageId(id)}
                description={name}
                hasSubmenu
              >
                {label}
              </Dropdown.ActionItem>
            ))}
          </Dropdown.Section>
        </Dropdown.Page>
        {selectFields.map(({ id, label, options }) => {
          const matchingOptions = (options ?? []).filter((option) =>
            normalizeSearchText(option.label).includes(
              normalizedSearchInputValue,
            ),
          );

          return (
            <Dropdown.Page key={id} id={getFieldPageId(id)} type="picker">
              <Dropdown.ActionItem
                startIcon={<IconChevronLeft />}
                page={FIELDS_PAGE_ID}
                hasSubmenu={false}
                closeOnClick={false}
              >
                {label}
              </Dropdown.ActionItem>
              <Dropdown.Search
                value={searchInputValue}
                onValueChange={setSearchInputValue}
                placeholder={t`Search`}
                aria-label={t`Search`}
              />
              <Dropdown.Separator />
              <Dropdown.Section scrollable>
                {matchingOptions.map((option) => (
                  <Dropdown.ActionItem
                    key={option.id}
                    description={option.value}
                    onClick={() => onInsert(`"${option.value}"`)}
                  >
                    {option.label}
                  </Dropdown.ActionItem>
                ))}
              </Dropdown.Section>
            </Dropdown.Page>
          );
        })}
      </DropdownContent>
    </DropdownRoot>
  );
};
