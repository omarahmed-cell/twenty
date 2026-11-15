import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { Select } from '@/ui/input/components/Select';
import { SettingsDataModelFieldFormulaSelectValuesMenu } from '@/settings/data-model/fields/forms/formula/components/SettingsDataModelFieldFormulaSelectValuesMenu';
import { type MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { FORMULA_FUNCTION_SIGNATURES, isDefined } from 'twenty-shared/utils';
import { themeCssVariables } from 'twenty-ui/theme';
import { FieldMetadataType } from '~/generated-metadata/graphql';

const StyledContainer = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[2]};
  grid-template-columns: repeat(3, minmax(0, 1fr));
`;

const FUNCTION_DESCRIPTIONS: Record<string, MessageDescriptor> = {
  if: msg`One of two values, depending on a condition`,
  between: msg`Whether a number is in a range, inclusive`,
  isEmpty: msg`Whether a value is empty`,
  abs: msg`The number without its sign`,
  round: msg`Rounded to a number of decimals`,
  floor: msg`Rounded down`,
  ceil: msg`Rounded up`,
  min: msg`The smallest value, ignoring empty ones`,
  max: msg`The largest value, ignoring empty ones`,
  concat: msg`Texts joined together, ignoring empty ones`,
  lower: msg`Text in lowercase`,
  upper: msg`Text in uppercase`,
  length: msg`How many characters or items`,
  contains: msg`Whether a text or list contains a value`,
  daysBetween: msg`Days between two dates`,
  hoursBetween: msg`Hours between two dates`,
  date: msg`A date from text`,
  addDays: msg`A date some days later`,
  addHours: msg`A date some hours later`,
  addMonths: msg`A date some months later`,
  year: msg`The year of a date`,
  month: msg`The month of a date, from 1 to 12`,
  dayOfMonth: msg`The day of a date, from 1 to 31`,
};

type SettingsDataModelFieldFormulaInsertMenusProps = {
  referenceableFields: FieldMetadataItem[];
  onInsert: (text: string, caretOffsetFromEnd?: number) => void;
  disabled?: boolean;
};

export const SettingsDataModelFieldFormulaInsertMenus = ({
  referenceableFields,
  onInsert,
  disabled = false,
}: SettingsDataModelFieldFormulaInsertMenusProps) => {
  const { t, i18n } = useLingui();

  const functionOptions = Object.entries(FORMULA_FUNCTION_SIGNATURES).map(
    ([name, signature]) => {
      const description = FUNCTION_DESCRIPTIONS[name];

      return {
        label: signature,
        value: name,
        contextualText: isDefined(description)
          ? i18n._(description)
          : undefined,
      };
    },
  );

  const fieldOptions = referenceableFields.map(({ label, name }) => ({
    label,
    value: name,
    contextualText: name,
  }));

  const selectFields = referenceableFields.filter(
    ({ type }) =>
      type === FieldMetadataType.SELECT ||
      type === FieldMetadataType.MULTI_SELECT,
  );

  const [lastInsertedSelectFieldId, setLastInsertedSelectFieldId] = useState<
    string | undefined
  >();

  const handleFieldInsert = (name: string) => {
    if (name === '') {
      return;
    }

    onInsert(name);

    const insertedSelectField = selectFields.find(
      (field) => field.name === name,
    );

    if (isDefined(insertedSelectField)) {
      setLastInsertedSelectFieldId(insertedSelectField.id);
    }
  };

  return (
    <StyledContainer>
      <Select
        dropdownId="field-formula-insert-function"
        fullWidth
        withSearchInput
        disabled={disabled}
        value=""
        emptyOption={{ label: t`Functions`, value: '' }}
        options={functionOptions}
        onChange={(name) => name !== '' && onInsert(`${name}()`, 1)}
      />
      <Select
        dropdownId="field-formula-insert-field"
        fullWidth
        withSearchInput
        disabled={disabled}
        value=""
        emptyOption={{ label: t`Fields`, value: '' }}
        options={fieldOptions}
        onChange={handleFieldInsert}
      />
      <SettingsDataModelFieldFormulaSelectValuesMenu
        selectFields={selectFields}
        defaultFieldId={lastInsertedSelectFieldId}
        onInsert={onInsert}
        disabled={disabled}
      />
    </StyledContainer>
  );
};
