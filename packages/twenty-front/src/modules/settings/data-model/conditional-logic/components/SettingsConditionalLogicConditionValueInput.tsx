import { isNumber, isString } from '@sniptt/guards';
import { FieldMetadataType } from 'twenty-shared/types';
import {
  type ConditionalLogicCondition,
  type ConditionalLogicConditionValue,
  isConditionalLogicListOperator,
  isConditionalLogicOperatorValueless,
  isDefined,
} from 'twenty-shared/utils';

import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { FormDateFieldInput } from '@/object-record/record-field/ui/form-types/components/FormDateFieldInput';
import { FormMultiRecordPicker } from '@/object-record/record-field/ui/form-types/components/FormMultiRecordPicker';
import { FormMultiSelectFieldInput } from '@/object-record/record-field/ui/form-types/components/FormMultiSelectFieldInput';
import { FormNumberFieldInput } from '@/object-record/record-field/ui/form-types/components/FormNumberFieldInput';
import { FormTextFieldInput } from '@/object-record/record-field/ui/form-types/components/FormTextFieldInput';

const NUMBER_FIELD_TYPES = new Set<string>([
  FieldMetadataType.NUMBER,
  FieldMetadataType.NUMERIC,
  FieldMetadataType.CURRENCY,
]);

const DATE_FIELD_TYPES = new Set<string>([
  FieldMetadataType.DATE,
  FieldMetadataType.DATE_TIME,
]);

const toStringList = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter(isString) : [];

type SettingsConditionalLogicConditionValueInputProps = {
  condition: ConditionalLogicCondition;
  fieldMetadataItem: FieldMetadataItem;
  onChange: (value: ConditionalLogicConditionValue) => void;
};

export const SettingsConditionalLogicConditionValueInput = ({
  condition,
  fieldMetadataItem,
  onChange,
}: SettingsConditionalLogicConditionValueInputProps) => {
  const { operator, value } = condition;

  if (isConditionalLogicOperatorValueless(operator)) {
    return null;
  }

  if (isConditionalLogicListOperator(operator)) {
    if (fieldMetadataItem.type === FieldMetadataType.RELATION) {
      const targetObjectNameSingular =
        fieldMetadataItem.relation?.targetObjectMetadata.nameSingular;

      if (!isDefined(targetObjectNameSingular)) {
        return null;
      }

      return (
        <FormMultiRecordPicker
          objectNameSingular={targetObjectNameSingular}
          defaultValue={toStringList(value)}
          onChange={(recordIds) => onChange(toStringList(recordIds))}
        />
      );
    }

    return (
      <FormMultiSelectFieldInput
        options={fieldMetadataItem.options ?? []}
        defaultValue={toStringList(value)}
        onChange={(optionValues) => onChange(toStringList(optionValues))}
      />
    );
  }

  if (NUMBER_FIELD_TYPES.has(fieldMetadataItem.type)) {
    return (
      <FormNumberFieldInput
        defaultValue={isNumber(value) ? value : undefined}
        onChange={(numberValue) => {
          const parsed = isString(numberValue)
            ? Number(numberValue)
            : numberValue;

          onChange(isNumber(parsed) && !Number.isNaN(parsed) ? parsed : null);
        }}
      />
    );
  }

  if (DATE_FIELD_TYPES.has(fieldMetadataItem.type)) {
    return (
      <FormDateFieldInput
        defaultValue={isString(value) ? value : undefined}
        onChange={(dateValue) =>
          onChange(isString(dateValue) ? dateValue.slice(0, 10) : null)
        }
      />
    );
  }

  return (
    <FormTextFieldInput
      defaultValue={isString(value) ? value : ''}
      onChange={onChange}
    />
  );
};
