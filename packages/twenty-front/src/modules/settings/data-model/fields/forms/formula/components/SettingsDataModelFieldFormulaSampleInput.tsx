import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { COMPOSITE_FIELD_SUB_FIELD_LABEL_MESSAGES } from '@/settings/data-model/constants/CompositeFieldSubFieldLabelMessages';
import { SettingsDataModelFieldFormulaMultiSelectInput } from '@/settings/data-model/fields/forms/formula/components/SettingsDataModelFieldFormulaMultiSelectInput';
import {
  FORMULA_SAMPLE_SUB_FIELDS,
  type FormulaSampleInputs,
  type FormulaSampleInputValue,
  getFormulaSampleSubFields,
} from '@/settings/data-model/fields/forms/formula/utils/buildFormulaSampleRecord';
import { Select } from '@/ui/input/components/Select';
import { SettingsTextInput } from '@/ui/input/components/SettingsTextInput';
import { useCurrencies } from '@/ui/input/components/internal/hooks/useCurrencies';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { themeCssVariables } from 'twenty-ui/theme';
import { FieldMetadataType } from '~/generated-metadata/graphql';

const TEXT_INPUT_FIELD_TYPES: FieldMetadataType[] = [
  FieldMetadataType.TEXT,
  FieldMetadataType.RATING,
  FieldMetadataType.UUID,
];

const StyledRow = styled.div`
  display: flex;
  gap: ${themeCssVariables.spacing[2]};

  & > * {
    flex: 1;
    min-width: 0;
  }
`;

const StyledHint = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
`;

type SettingsDataModelFieldFormulaSampleInputProps = {
  field: FieldMetadataItem;
  expression: string;
  inputs: FormulaSampleInputs;
  onChange: (key: string, value: FormulaSampleInputValue) => void;
};

export const SettingsDataModelFieldFormulaSampleInput = ({
  field,
  expression,
  inputs,
  onChange,
}: SettingsDataModelFieldFormulaSampleInputProps) => {
  const { t, i18n } = useLingui();
  const currencies = useCurrencies();

  const { id, name, label, type } = field;
  const inputLabel = `${label} (${name})`;
  const instanceId = `field-formula-test-${id}`;
  const getText = (key: string) => {
    const value = inputs[key];

    return typeof value === 'string' ? value : '';
  };
  const optionChoices = (field.options ?? []).map((option) => ({
    label: option.label,
    value: option.value,
  }));

  switch (type) {
    case FieldMetadataType.SELECT:
      return (
        <Select
          dropdownId={instanceId}
          label={inputLabel}
          fullWidth
          withSearchInput
          value={getText(name)}
          options={[{ label: t`Empty`, value: '' }, ...optionChoices]}
          onChange={(value) => onChange(name, value)}
        />
      );
    case FieldMetadataType.MULTI_SELECT: {
      const value = inputs[name];

      return (
        <SettingsDataModelFieldFormulaMultiSelectInput
          dropdownId={instanceId}
          label={inputLabel}
          options={optionChoices}
          value={Array.isArray(value) ? value : []}
          onChange={(nextValue) => onChange(name, nextValue)}
        />
      );
    }
    case FieldMetadataType.BOOLEAN:
      return (
        <Select
          dropdownId={instanceId}
          label={inputLabel}
          fullWidth
          value={getText(name)}
          options={[
            { label: t`Empty`, value: '' },
            { label: t`Yes`, value: 'true' },
            { label: t`No`, value: 'false' },
          ]}
          onChange={(value) => onChange(name, value)}
        />
      );
    case FieldMetadataType.NUMBER:
    case FieldMetadataType.NUMERIC:
    case FieldMetadataType.DATE:
    case FieldMetadataType.DATE_TIME:
      return (
        <SettingsTextInput
          instanceId={instanceId}
          label={inputLabel}
          fullWidth
          type={
            type === FieldMetadataType.DATE
              ? 'date'
              : type === FieldMetadataType.DATE_TIME
                ? 'datetime-local'
                : 'number'
          }
          value={getText(name)}
          onChange={(value) => onChange(name, value)}
        />
      );
    case FieldMetadataType.CURRENCY: {
      const currencyCodeKey = `${name}.currencyCode`;

      return (
        <StyledRow>
          <SettingsTextInput
            instanceId={instanceId}
            label={inputLabel}
            fullWidth
            type="number"
            value={getText(`${name}.amount`)}
            onChange={(value) => onChange(`${name}.amount`, value)}
          />
          <Select
            dropdownId={`${instanceId}-currency`}
            label={t`Currency`}
            fullWidth
            withSearchInput
            value={getText(currencyCodeKey)}
            options={currencies.map(({ value, label: currencyLabel }) => ({
              value,
              label: currencyLabel,
            }))}
            onChange={(value) => onChange(currencyCodeKey, value)}
          />
        </StyledRow>
      );
    }
    default:
      if (TEXT_INPUT_FIELD_TYPES.includes(type)) {
        return (
          <SettingsTextInput
            instanceId={instanceId}
            label={inputLabel}
            fullWidth
            value={getText(name)}
            onChange={(value) => onChange(name, value)}
          />
        );
      }

      if (FORMULA_SAMPLE_SUB_FIELDS[type] !== undefined) {
        const subFieldLabels =
          COMPOSITE_FIELD_SUB_FIELD_LABEL_MESSAGES[
            type as keyof typeof COMPOSITE_FIELD_SUB_FIELD_LABEL_MESSAGES
          ];

        return (
          <>
            {getFormulaSampleSubFields(expression, field).map((subField) => {
              const subFieldLabel = subFieldLabels?.[subField];
              const key = `${name}.${subField}`;

              return (
                <SettingsTextInput
                  key={key}
                  instanceId={`${instanceId}-${subField}`}
                  label={`${label}: ${subFieldLabel !== undefined ? i18n._(subFieldLabel) : subField} (${key})`}
                  fullWidth
                  type={subField === 'primaryLinkUrl' ? 'url' : 'text'}
                  value={getText(key)}
                  onChange={(value) => onChange(key, value)}
                />
              );
            })}
          </>
        );
      }

      return <StyledHint>{t`Pick a record to test with ${label}.`}</StyledHint>;
  }
};
